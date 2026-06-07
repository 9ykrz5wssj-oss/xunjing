import { Socket } from "socket.io";
import { Message } from "../models/Message";
import { getPrivateConversationId, getGroupConversationId } from "../utils/conversationId";
import { ConversationType, ContentType, EVENT_CONFIG, ActivityStatus, ParticipantStatus } from "../config/constants";
import { getRedis } from "../config/redis";
import { Event } from "../models/Event";
import { EventParticipant } from "../models/EventParticipant";
import { User } from "../models/User";
import { logger } from "../utils/logger";
import {
  PrivateMessagePayload,
  GroupMessagePayload,
  MessagePayload,
} from "../types/socket";

// ── 私聊消息 ──
export async function handlePrivateMessage(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: PrivateMessagePayload
): Promise<void> {
  try {
    const conversationId = getPrivateConversationId(user.userId, data.receiverId);
    const sender = await User.findById(user.userId).select("nickname avatar userId");

    // Socket 仅转发通知，不存储（存储由 REST API 负责）
    const msgPayload: MessagePayload = {
      senderId: user.userId.toString(),
      senderNickname: sender?.nickname || "用户",
      senderAvatar: sender?.avatar || "",
      content: data.content,
      contentType: data.contentType || ContentType.TEXT,
      createdAt: new Date().toISOString(),
    };

    socket.to(`user:${data.receiverId}`).emit("new_private_message", {
      conversationId,
      message: msgPayload,
    });

    logger.debug(`[私聊] ${user.numericId} → ${data.receiverId}`);
  } catch (error) {
    logger.error("[私聊] 发送失败:", error);
  }
}

// ── 群聊消息 ──
export async function handleGroupMessage(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: GroupMessagePayload
): Promise<void> {
  try {
    const conversationId = getGroupConversationId(data.eventId);

    // 验证用户是否有权限发言
    const redis = getRedis();
    const isMember = await redis.sismember(`group_chat:${data.eventId}`, user.userId.toString());

    if (!isMember) {
      // 回退到数据库查询
      const participant = await EventParticipant.findOne({
        eventId: data.eventId as any,
        userId: user.userId as any,
        status: ParticipantStatus.ACCEPTED,
      } as any);

      if (!participant) {
        return; // 无权限，静默忽略
      }

      // 补回Redis
      await redis.sadd(`group_chat:${data.eventId}`, user.userId.toString());
    }

    // 检查活动状态（结束1小时后只读）
    const event = await Event.findById(data.eventId);
    if (event) {
      const now = new Date();
      if (event.status === ActivityStatus.CANCELLED) {
        return;
      }
      if (event.status === ActivityStatus.FINISHED) {
        const deadline = new Date(event.endTime.getTime() + EVENT_CONFIG.GROUP_CHAT_READONLY_AFTER_HOURS * 3600 * 1000);
        if (now > deadline) {
          return; // 已过只读窗口
        }
      }
    }

    const sender2 = await User.findById(user.userId).select("nickname avatar userId");

    const msgPayload2: MessagePayload = {
      senderId: user.userId.toString(),
      senderNickname: sender2?.nickname || "用户",
      senderAvatar: sender2?.avatar || "",
      content: data.content,
      contentType: data.contentType || ContentType.TEXT,
      createdAt: new Date().toISOString(),
    };

    // 广播给房间内所有人
    socket.to(`event:${data.eventId}`).emit("new_group_message", {
      eventId: data.eventId,
      message: msgPayload2,
    });

    // 也发给自己（因为自己不在 `to` 中）
    socket.emit("new_group_message", {
      eventId: data.eventId,
      message: msgPayload2,
    });

    logger.debug(`[群聊] 用户${user.numericId} 在活动${data.eventId}中发言`);
  } catch (error) {
    logger.error("[群聊] 发送失败:", error);
  }
}

// ── 输入状态 ──
export async function handleTyping(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: { conversationId: string; conversationType: string },
  isTyping: boolean
): Promise<void> {
  const eventName = isTyping ? "user_typing" : "user_stop_typing";

  if (data.conversationType === "private") {
    // conversationId 格式: "userId1_userId2"
    const parts = data.conversationId.split("_");
    const otherUserId = parts.find((id) => id !== user.userId.toString());
    if (otherUserId) {
      socket.to(`user:${otherUserId}`).emit(eventName, {
        userId: user.userId.toString(),
        conversationId: data.conversationId,
        conversationType: data.conversationType,
      });
    }
  } else {
    // 群聊
    const eventId = data.conversationId.replace("event_", "");
    socket.to(`event:${eventId}`).emit(eventName, {
      userId: user.userId.toString(),
      conversationId: data.conversationId,
      conversationType: data.conversationType,
    });
  }
}

// ── 已读标记 ──
export async function handleMarkRead(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: { conversationId: string; conversationType: string }
): Promise<void> {
  try {
    await Message.updateMany(
      {
        conversationId: data.conversationId,
        readBy: { $ne: user.userId },
      },
      {
        $addToSet: { readBy: user.userId },
      }
    );
  } catch (error) {
    logger.error("[已读标记] 更新失败:", error);
  }
}
