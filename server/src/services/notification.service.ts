import { Notification, INotification } from "../models/Notification";
import { NotificationType } from "../config/constants";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  referenceId?: mongoose.Types.ObjectId | string | null;
  title: string;
  body: string;
}

/**
 * 创建通知并返回（由调用方决定是否推送Socket事件）
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<INotification | null> {
  try {
    const notification = await Notification.create({
      userId: params.userId,
      type: params.type,
      referenceId: params.referenceId || null,
      title: params.title,
      body: params.body,
    });
    return notification;
  } catch (error) {
    logger.error("创建通知失败:", error);
    return null;
  }
}

/**
 * 批量创建通知（用于发送给活动所有参与者）
 */
export async function createNotificationsForMany(
  userIds: (mongoose.Types.ObjectId | string)[],
  params: Omit<CreateNotificationParams, "userId">
): Promise<void> {
  const docs = userIds.map((userId) => ({
    userId,
    type: params.type,
    referenceId: params.referenceId || null,
    title: params.title,
    body: params.body,
  }));

  try {
    await Notification.insertMany(docs);
  } catch (error) {
    logger.error("批量创建通知失败:", error);
  }
}
