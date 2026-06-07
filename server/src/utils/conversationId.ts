import mongoose from "mongoose";

/**
 * 生成私聊对话的确定性ID
 * 两用户ID排序后拼接，确保双方读写同一对话
 */
export function getPrivateConversationId(
  userId1: string | mongoose.Types.ObjectId,
  userId2: string | mongoose.Types.ObjectId
): string {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
}

/**
 * 生成群聊对话ID（基于活动ID）
 */
export function getGroupConversationId(eventId: string | mongoose.Types.ObjectId): string {
  return `event_${eventId.toString()}`;
}
