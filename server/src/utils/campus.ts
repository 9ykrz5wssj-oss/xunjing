import { Campus, CAMPUS_CENTERS } from "../config/constants";

interface CampusBounds { minLng: number; maxLng: number; minLat: number; maxLat: number; }

// 默认边界（数据库没配置时使用）
const DEFAULT_BOUNDS: Record<Campus, CampusBounds> = {
  [Campus.GULOU]: { minLng: 118.7720, maxLng: 118.7805, minLat: 32.0550, maxLat: 32.0615 },
  [Campus.XIANLIN]: { minLng: 118.9450, maxLng: 118.9570, minLat: 32.1100, maxLat: 32.1220 },
};

// 缓存（避免每次请求都查DB）
let cachedBounds: Record<string, CampusBounds> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1分钟

async function getBounds(): Promise<Record<string, CampusBounds>> {
  if (cachedBounds && Date.now() - cacheTime < CACHE_TTL) return cachedBounds;
  try {
    const { getCampusConfigs } = await import("../models/CampusConfig");
    const db = await getCampusConfigs();
    cachedBounds = {
      gulou: db.gulou || DEFAULT_BOUNDS.gulou,
      xianlin: db.xianlin || DEFAULT_BOUNDS.xianlin,
    };
  } catch {
    cachedBounds = { ...DEFAULT_BOUNDS };
  }
  cacheTime = Date.now();
  return cachedBounds;
}

export async function isInCampus(lat: number, lng: number, campus: Campus): Promise<boolean> {
  const bounds = await getBounds();
  const b = bounds[campus];
  if (!b) return false;
  return lng >= b.minLng && lng <= b.maxLng && lat >= b.minLat && lat <= b.maxLat;
}

export async function identifyCampus(lat: number, lng: number): Promise<Campus | null> {
  const bounds = await getBounds();
  for (const [campus, b] of Object.entries(bounds)) {
    if (lng >= b.minLng && lng <= b.maxLng && lat >= b.minLat && lat <= b.maxLat) {
      return campus as Campus;
    }
  }
  return null;
}

export async function randomPointInCampus(campus: Campus): Promise<{ lat: number; lng: number }> {
  const bounds = await getBounds();
  const b = bounds[campus] || DEFAULT_BOUNDS[campus];
  const lat = b.minLat + Math.random() * (b.maxLat - b.minLat);
  const lng = b.minLng + Math.random() * (b.maxLng - b.minLng);
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

// 清除缓存（管理更新后调用）
export function clearCampusCache(): void {
  cachedBounds = null;
  cacheTime = 0;
}
