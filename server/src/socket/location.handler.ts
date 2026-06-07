import { Socket } from "socket.io";
import { getRedis } from "../config/redis";
import { validateGeofence, isWithinChestRadius } from "../services/geo.service";
import { Chest } from "../models/Chest";
import { ChestStatus, CHEST_CONFIG } from "../config/constants";
import { LocationUpdatePayload } from "../types/socket";
import { logger } from "../utils/logger";

export async function handleLocationUpdate(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: LocationUpdatePayload
): Promise<void> {
  const { lat, lng, campus } = data;
  const redis = getRedis();

  // 1. 先更新 Redis 中的用户位置（无论围栏校验是否通过，确保开箱能拿到坐标）
  await redis.setex(`location:${user.userId}`, 120, `${lng},${lat}`);

  try {
    await redis.geoadd(`campus:${campus}_users`, lng, lat, user.userId.toString());
  } catch {}

  // 2. 地理围栏检查（仅告警，不阻断宝箱距离检测）
  const geofenceResult = await validateGeofence(lat, lng, campus);
  const targetCampus = geofenceResult.actualCampus || campus;

  if (!geofenceResult.valid) {
    socket.emit("geofence_warning", {
      message: geofenceResult.message || "您已离开校区范围",
    });
    // 不 return，继续检查宝箱距离
  }

  // 3. 检查与所有活跃宝箱的距离
  const activeChests = await Chest.find({
    campus: targetCampus,
    status: ChestStatus.ACTIVE,
  });

  for (const chest of activeChests) {
    const distance = await isWithinChestRadius(
      lat,
      lng,
      chest.coordinates.lat,
      chest.coordinates.lng,
      CHEST_CONFIG.CHEST_PROXIMITY_RADIUS_M
    );

    const chestKey = `chest_nearby:${chest._id.toString()}`;

    if (distance) {
      await redis.sadd(chestKey, user.userId.toString());
    } else {
      await redis.srem(chestKey, user.userId.toString());
    }

    // 对高级宝箱：广播实时人数
    if (chest.type === "advanced") {
      const count = await redis.scard(chestKey);
      socket.emit("chest_player_count", {
        chestId: chest._id.toString(),
        currentCount: count,
        requiredCount: chest.requiredPlayers,
      });
    }
  }
}
