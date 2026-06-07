import nodeCron from "node-cron";
import { Event } from "../models/Event";
import { EventParticipant } from "../models/EventParticipant";
import { Message } from "../models/Message";
import { getRedis } from "../config/redis";
import { ActivityStatus, ParticipantStatus, NotificationType, EVENT_CONFIG, ConversationType } from "../config/constants";
import { createNotification } from "../services/notification.service";
import { getIO } from "../socket";
import { logger } from "../utils/logger";

async function transitionEvent(event: any, newStatus: ActivityStatus) {
  const oldStatus = event.status;
  event.status = newStatus;
  await event.save();

  const participants = await EventParticipant.find({
    eventId: event._id,
    status: ParticipantStatus.ACCEPTED,
  });

  const title = newStatus === ActivityStatus.ONGOING ? "活动已开始" : "活动已结束";
  const body = newStatus === ActivityStatus.ONGOING ? "你参与的活动已进入进行中状态" : "你参与的活动已圆满结束";

  for (const p of participants) {
    await createNotification({
      userId: p.userId, type: NotificationType.EVENT_STATUS_CHANGE,
      referenceId: event._id, title, body,
    });
  }

  const io = getIO();
  io.to(`event:${event._id.toString()}`).emit("event_status_changed", {
    eventId: event._id.toString(), newStatus, oldStatus,
  });

  logger.info(`[Cron] 活动 ${event._id} 状态: ${oldStatus} → ${newStatus}`);
}

export function startEventStatusCron(): ReturnType<typeof nodeCron.schedule> {
  const task = nodeCron.schedule("* * * * *", async () => {
    const now = new Date();
    let count = 0;

    try {
      // 招募中/等待开始 → 进行中（到达开始时间自动开始）
      const startingEvents = await Event.find({
        status: { $in: [ActivityStatus.RECRUITING, ActivityStatus.WAITING] },
        startTime: { $lte: now },
      });
      for (const event of startingEvents) {
        // 自动拒绝所有未处理的申请
        const pending = await EventParticipant.find({
          eventId: event._id,
          role: "participant",
          status: ParticipantStatus.APPLIED,
        });
        for (const p of pending) {
          p.status = ParticipantStatus.REJECTED;
          p.respondedAt = new Date();
          await p.save();
          await createNotification({
            userId: p.userId, type: NotificationType.EVENT_REJECTED,
            referenceId: event._id, title: "申请未通过", body: "活动已开始，你的申请未被及时处理",
          });
        }
        if (pending.length > 0) {
          logger.info(`[Cron] 自动拒绝 ${pending.length} 个未处理申请 (活动 ${event._id})`);
        }
        await transitionEvent(event, ActivityStatus.ONGOING);
        count++;
      }

      // 进行中 → 圆满结束
      const endingEvents = await Event.find({
        status: ActivityStatus.ONGOING,
        endTime: { $lte: now },
      });
      for (const event of endingEvents) {
        await transitionEvent(event, ActivityStatus.FINISHED);
        count++;
      }

      if (count > 0) logger.info(`[Cron] ${count} 个活动状态自动变更`);

      // 清理临时会话：活动结束后24小时删除群聊消息
      const deadline = new Date(now.getTime() - EVENT_CONFIG.GROUP_CHAT_READONLY_AFTER_HOURS * 3600 * 1000);
      const expiredEvents = await Event.find({
        status: ActivityStatus.FINISHED,
        endTime: { $lte: deadline },
      });
      for (const event of expiredEvents) {
        const convId = `event_${event._id.toString()}`;
        const delResult = await Message.deleteMany({ conversationId: convId, conversationType: ConversationType.GROUP });
        if (delResult.deletedCount > 0) {
          logger.info(`[Cron] 清理临时会话 ${convId}: 删除 ${delResult.deletedCount} 条消息`);
        }
        // 清理Redis中的群聊成员
        const redis = getRedis();
        await redis.del(`group_chat:${event._id.toString()}`);
        count++;
      }
    } catch (error) {
      logger.error("[Cron] 活动状态更新失败:", error);
    }
  });

  logger.info("[Cron] 活动状态定时器已启动（每分钟）");
  return task;
}
