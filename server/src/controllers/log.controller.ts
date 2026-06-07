import { Response } from "express";
import { AuthRequest } from "../types";
import { EventParticipant } from "../models/EventParticipant";
import { ChestOpenLog } from "../models/ChestOpenLog";
import mongoose from "mongoose";

export async function getFeed(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { before, limit = "20" } = req.query;

    // 活动记录
    const activityQuery: any = { userId };
    if (before) activityQuery.appliedAt = { $lt: new Date(before as string) };

    const activities = await EventParticipant.find(activityQuery)
      .populate({ path: "eventId", populate: { path: "typeId hostId", select: "name iconUrl color nickname avatar userId" } })
      .sort({ appliedAt: -1 })
      .limit(+limit)
      .lean();

    // 藏品获得记录
    const chestQuery: any = { userId };
    if (before) chestQuery.openedAt = { $lt: new Date(before as string) };

    const collectionLogs = await ChestOpenLog.find(chestQuery)
      .populate("itemDroppedId", "name imageUrl rarity")
      .sort({ openedAt: -1 })
      .limit(+limit)
      .lean();

    // 合并、排序
    const feed: any[] = [];

    for (const a of activities) {
      feed.push({
        type: "activity",
        timestamp: a.appliedAt,
        data: a,
      });
    }

    for (const c of collectionLogs) {
      feed.push({
        type: "collection",
        timestamp: c.openedAt,
        data: c,
      });
    }

    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const sliced = feed.slice(0, +limit);

    res.json({ success: true, data: { feed: sliced, hasMore: feed.length > +limit } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
