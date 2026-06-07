import { Socket } from "socket.io";
import { getRedis } from "../config/redis";
import { Chest } from "../models/Chest";
import { ChestOpenLog } from "../models/ChestOpenLog";
import { UserCollection } from "../models/UserCollection";
import { User } from "../models/User";
import { ChestStatus, ChestType, CHEST_CONFIG } from "../config/constants";
import { isWithinChestRadius } from "../services/geo.service";
import { rollDrop } from "../services/drop.service";
import { createNotification } from "../services/notification.service";
import { NotificationType } from "../config/constants";
import { getIO } from "./index";
import { logger } from "../utils/logger";

export async function handleChestOpenRequest(
  socket: Socket,
  user: { userId: string; numericId: number; role?: string },
  data: { chestId: string }
): Promise<void> {
  const { chestId } = data;
  const redis = getRedis();
  const io = getIO();

  try {
    // 1. 查找宝箱
    const chest = await Chest.findById(chestId);
    if (!chest || chest.status !== ChestStatus.ACTIVE) {
      socket.emit("chest_open_result", {
        chestId,
        success: false,
        error: "宝箱不存在或已被开启",
      });
      return;
    }

    // 2. 检查距离
    const locStr = await redis.get(`location:${user.userId}`);
    if (!locStr) {
      socket.emit("chest_open_result", {
        chestId,
        success: false,
        error: "无法获取您的位置信息",
      });
      return;
    }

    const [lng, lat] = locStr.split(",").map(Number);
    const inRange = isWithinChestRadius(
      lat,
      lng,
      chest.coordinates.lat,
      chest.coordinates.lng,
      CHEST_CONFIG.CHEST_PROXIMITY_RADIUS_M
    );

    if (!inRange) {
      socket.emit("chest_open_result", {
        chestId,
        success: false,
        error: "您离宝箱太远了，请靠近后再试",
      });
      return;
    }

    // 3. 频率限制检查（管理员跳过冷却）
    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      if (chest.type === ChestType.NORMAL) {
        const cooldownKey = `rate:chest_normal:${user.userId}`;
        const inCooldown = await redis.exists(cooldownKey);
        if (inCooldown) {
          socket.emit("chest_open_result", {
            chestId,
            success: false,
            error: "冷却中，请一小时后再试",
          });
          return;
        }
      } else {
        const cooldownKey = `rate:chest_advanced:${user.userId}`;
        const inCooldown = await redis.exists(cooldownKey);
        if (inCooldown) {
          socket.emit("chest_open_result", {
            chestId,
            success: false,
            error: "冷却中，请一天后再试",
          });
          return;
        }
      }
    }

    // 4. 高级宝箱：检查人数，若满足则群发给范围内所有人
    const nearbyKey = `chest_nearby:${chestId}`;
    if (chest.type === ChestType.ADVANCED) {
      const nearbyCount = await redis.scard(nearbyKey);

      if (nearbyCount < chest.requiredPlayers) {
        socket.emit("chest_open_result", {
          chestId,
          success: false,
          error: `还需${chest.requiredPlayers - nearbyCount}人才能开启`,
        });
        io.to(`user:${user.userId}`).emit("chest_player_count", {
          chestId,
          currentCount: nearbyCount,
          requiredCount: chest.requiredPlayers,
        });
        return;
      }

      // 满足条件：获取范围内所有用户的 userId
      const nearbyUserIds = await redis.smembers(nearbyKey);

      // 先标记宝箱已开启，防止重复触发
      chest.status = ChestStatus.OPENED;
      chest.openedBy = user.userId as any;
      chest.openedAt = new Date();
      await chest.save();

      // 给每个范围内的用户独立掉落
      for (const nuid of nearbyUserIds) {
        try {
          const drop = await rollDrop(chest.type);
          if (!drop) continue;

          await ChestOpenLog.create({
            userId: nuid,
            chestId: chest._id,
            chestType: chest.type,
            itemDroppedId: drop.item._id,
            itemDroppedRarity: drop.rarity,
            openedAt: new Date(),
          });

          await UserCollection.findOneAndUpdate(
            { userId: nuid, itemId: drop.item._id },
            { $inc: { count: 1 }, $set: { lastAcquiredAt: new Date() }, $setOnInsert: { acquiredAt: new Date() } },
            { upsert: true, new: true }
          );

          // 查找该用户的 numericId 用于通知
          const nearbyUser = await User.findById(nuid).select("userId");
          if (nearbyUser) {
            await User.findByIdAndUpdate(nuid, { $inc: { "stats.totalCollections": 1 } });
            await createNotification({
              userId: nuid,
              type: NotificationType.NEW_COLLECTION,
              referenceId: drop.item._id,
              title: "获得新藏品！",
              body: `获得了 ${drop.rarity} 藏品 "${drop.item.name}"`,
            });
            if (!isAdmin) {
              const cs = chest.type === ChestType.NORMAL ? CHEST_CONFIG.NORMAL_CHEST_COOLDOWN_HOURS * 3600 : CHEST_CONFIG.ADVANCED_CHEST_COOLDOWN_HOURS * 3600;
              await redis.setex(`rate:chest_${chest.type}:${nuid}`, cs, "1");
            }
            io.to(`user:${nuid}`).emit("chest_open_result", {
              chestId,
              success: true,
              item: { id: drop.item._id.toString(), name: drop.item.name, rarity: drop.rarity, imageUrl: drop.item.imageUrl },
            });
            logger.info(`[开箱-多人] 用户${nearbyUser.userId} 获得${drop.rarity}-${drop.item.name}`);
          }
        } catch (err) { logger.error("[开箱-多人] 处理用户失败:", err); }
      }

      io.emit("chest_removed", { chestId });
      // 清理附近集合
      await redis.del(nearbyKey);
      return;
    }

    // 5. 普通宝箱：单人掉落
    const drop = await rollDrop(chest.type);
    if (!drop) { socket.emit("chest_open_result", { chestId, success: false, error: "掉落异常，请联系管理员" }); return; }

    // 6. 更新宝箱状态
    chest.status = ChestStatus.OPENED;
    chest.openedBy = user.userId as any;
    chest.openedAt = new Date();
    await chest.save();

    // 7. 记录开箱日志
    await ChestOpenLog.create({
      userId: user.userId, chestId: chest._id, chestType: chest.type,
      itemDroppedId: drop.item._id, itemDroppedRarity: drop.rarity, openedAt: new Date(),
    });

    // 8. 更新用户藏品
    await UserCollection.findOneAndUpdate(
      { userId: user.userId, itemId: drop.item._id },
      { $inc: { count: 1 }, $set: { lastAcquiredAt: new Date() }, $setOnInsert: { acquiredAt: new Date() } },
      { upsert: true, new: true }
    );

    // 9. 更新用户统计
    await User.findByIdAndUpdate(user.userId, { $inc: { "stats.totalCollections": 1 } });

    // 10. 设置冷却（管理员不设置冷却）
    if (!isAdmin) {
      const cooldownSeconds = chest.type === ChestType.NORMAL ? CHEST_CONFIG.NORMAL_CHEST_COOLDOWN_HOURS * 3600 : CHEST_CONFIG.ADVANCED_CHEST_COOLDOWN_HOURS * 3600;
      await redis.setex(`rate:chest_${chest.type}:${user.userId}`, cooldownSeconds, "1");
    }

    // 11. 创建通知
    await createNotification({ userId: user.userId, type: NotificationType.NEW_COLLECTION, referenceId: drop.item._id, title: "获得新藏品！", body: `获得了 ${drop.rarity} 藏品 "${drop.item.name}"` });

    // 12. 返回结果
    socket.emit("chest_open_result", { chestId, success: true, item: { id: drop.item._id.toString(), name: drop.item.name, rarity: drop.rarity, imageUrl: drop.item.imageUrl } });

    // 13. 通知所有用户：宝箱已移除
    io.emit("chest_removed", { chestId });

    logger.info(`[开箱] 用户${user.numericId} 开启了 ${chest.campus} 的${chest.type === "advanced" ? "高级" : "普通"}宝箱，获得${drop.rarity}-${drop.item.name}`);
  } catch (error: any) {
    logger.error("[开箱] 处理失败:", error);
    socket.emit("chest_open_result", {
      chestId,
      success: false,
      error: "开箱处理失败，请稍后再试",
    });
  }
}
