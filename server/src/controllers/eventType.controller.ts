import { Response } from "express";
import { AuthRequest } from "../types";
import { EventType } from "../models/EventType";

export async function listEventTypes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const types = await EventType.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createEventType(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, iconUrl, sortOrder, color } = req.body;
    const type = await EventType.create({ name, iconUrl, sortOrder, color });
    res.status(201).json({ success: true, data: type });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateEventType(req: AuthRequest, res: Response): Promise<void> {
  try {
    const type = await EventType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!type) { res.status(404).json({ success: false, error: "类型不存在" }); return; }
    res.json({ success: true, data: type });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteEventType(req: AuthRequest, res: Response): Promise<void> {
  try {
    await EventType.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: "活动类型已停用" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
