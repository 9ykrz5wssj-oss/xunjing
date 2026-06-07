import { Response } from "express";
import { AuthRequest } from "../types";
import { Chest } from "../models/Chest";
import { ChestStatus } from "../config/constants";

export async function getActiveChests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { campus } = req.query;
    const filter: any = { status: ChestStatus.ACTIVE };
    if (campus) filter.campus = campus;

    const chests = await Chest.find(filter).select("type coordinates requiredPlayers expiresAt").sort({ createdAt: 1 });
    res.json({ success: true, data: chests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
