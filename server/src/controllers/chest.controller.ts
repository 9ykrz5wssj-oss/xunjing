import { Response } from "express";
import { AuthRequest } from "../types";
import { Chest } from "../models/Chest";
import { ChestConfig } from "../models/ChestConfig";
import { ChestStatus, CHEST_CONFIG } from "../config/constants";
import { getRedis } from "../config/redis";

export async function getActiveChests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { campus } = req.query;
    const filter: any = { status: ChestStatus.ACTIVE };
    if (campus) filter.campus = campus;

    const chests = await Chest.find(filter).select("type coordinates requiredPlayers expiresAt").sort({ createdAt: 1 });

    // 获取用户冷却状态
    const redis = getRedis();
    const normalCD = await redis.ttl(`rate:chest_normal:${req.user!.userId}`);
    const advancedCD = await redis.ttl(`rate:chest_advanced:${req.user!.userId}`);

    res.json({ success: true, data: chests, cooldowns: { normal: normalCD > 0 ? normalCD : 0, advanced: advancedCD > 0 ? advancedCD : 0 } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
