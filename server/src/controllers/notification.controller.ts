import { Response } from "express";
import { AuthRequest } from "../types";
import { Notification } from "../models/Notification";

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page = "1", limit = "20" } = req.query;
    const notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await Notification.countDocuments({ userId: req.user!.userId });
    const unreadCount = await Notification.countDocuments({ userId: req.user!.userId, isRead: false });
    res.json({ success: true, data: { notifications, total, unreadCount, page: +page } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.userId, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: "已标记为已读" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "全部已读" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
