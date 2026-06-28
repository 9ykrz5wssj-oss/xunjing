import { Response } from "express";
import { AuthRequest } from "../types";
import { Event } from "../models/Event";
import { CampusConfig } from "../models/CampusConfig";
import { ActivityStatus } from "../config/constants";

export async function getActivityPins(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { campus, lat, lng, radius } = req.query;

    const filter: any = {
      status: ActivityStatus.RECRUITING,
    };
    if (campus) filter.campus = campus;

    // 如果提供了坐标，筛选附近活动
    if (lat && lng) {
      const r = parseFloat(radius as string) || 5000; // 默认5km
      filter.meetCoordinates = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: r,
        },
      };
    }

    const events = await Event.find(filter)
      .populate("typeId", "name iconUrl color")
      .select("title meetCoordinates startTime typeId currentParticipants capacity locationText status description")
      .lean()
      .limit(50);

    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 获取所有校区边界（公开接口，供地图fitBounds使用）
export async function getCampusBounds(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await CampusConfig.find().select("campus minLng maxLng minLat maxLat");
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
