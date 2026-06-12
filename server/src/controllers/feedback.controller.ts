import { Response } from "express";
import { AuthRequest } from "../types";
import { Feedback } from "../models/Feedback";
import { User } from "../models/User";
import { logger } from "../utils/logger";

/**
 * 普通用户：提交反馈
 * POST /api/v1/feedback
 */
export async function createFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: "反馈内容不能为空" });
      return;
    }
    if (content.trim().length > 2000) {
      res.status(400).json({ success: false, error: "反馈内容不能超过2000字" });
      return;
    }

    const feedback = await Feedback.create({
      userId: req.user!.userId,
      content: content.trim(),
      status: "pending",
    });

    const user = await User.findById(req.user!.userId).select("nickname userId");
    logger.info(`[反馈] 用户 ${user?.userId} (${user?.nickname}) 提交了反馈: ${feedback._id}`);

    res.status(201).json({
      success: true,
      data: feedback,
      message: "反馈已提交，感谢你的反馈！",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 管理员：获取反馈列表
 * GET /api/v1/admin/feedback
 */
export async function listFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const filter: any = {};
    if (status === "pending" || status === "resolved") {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("userId", "nickname userId avatar email")
        .populate("resolvedBy", "nickname userId")
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 管理员：处理反馈（标记已解决，可选回复）
 * PUT /api/v1/admin/feedback/:id
 */
export async function resolveFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      res.status(404).json({ success: false, error: "反馈不存在" });
      return;
    }

    if (status) feedback.status = status;
    if (adminReply !== undefined) feedback.adminReply = adminReply;
    if (status === "resolved") {
      feedback.resolvedBy = req.user!.userId as any;
      feedback.resolvedAt = new Date();
    }

    await feedback.save();

    logger.info(`[管理员] 处理反馈 ${id}: status=${feedback.status}`);

    res.json({ success: true, data: feedback, message: "反馈状态已更新" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 普通用户：获取我的反馈列表
 * GET /api/v1/feedback
 */
export async function getMyFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("resolvedBy", "nickname userId")
        .lean(),
      Feedback.countDocuments({ userId: req.user!.userId }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
