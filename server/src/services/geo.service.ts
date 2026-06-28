import { isInCampus, identifyCampus } from "../utils/campus";
import { Campus, CAMPUS_NAMES } from "../config/constants";

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function validateGeofence(lat: number, lng: number, claimedCampus: string): Promise<{ valid: boolean; actualCampus: Campus | null; message?: string }> {
  const actualCampus = await identifyCampus(lat, lng);
  if (!actualCampus) {
    return { valid: false, actualCampus: null, message: "您已离开校区范围，无法进行宝箱相关操作" };
  }
  if (actualCampus !== claimedCampus) {
    return { valid: false, actualCampus, message: `您实际位于${CAMPUS_NAMES[actualCampus] || "未知校区"}` };
  }
  return { valid: true, actualCampus };
}

export async function isWithinChestRadius(userLat: number, userLng: number, chestLat: number, chestLng: number, radiusM: number = 20): Promise<boolean> {
  return haversineDistance(userLat, userLng, chestLat, chestLng) <= radiusM;
}
