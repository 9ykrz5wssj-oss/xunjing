import AsyncStorage from "@react-native-async-storage/async-storage";
import { Campus } from "./constants";

// ---- 缓存数据类型 ----

export interface CachedLocation {
  lat: number;
  lng: number;
  campus: Campus;
  timestamp: number;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
}

export interface CachedChestsPayload {
  chests: any[];
  cooldowns: { normal: number; advanced: number };
}

// ---- 内部工具 ----

const LOCATION_KEY = "map_cache:location";
const CHESTS_PREFIX = "map_cache:chests";
const EVENTS_PREFIX = "map_cache:events";

function chestsKey(campus: Campus) {
  return `${CHESTS_PREFIX}_${campus}`;
}
function eventsKey(campus: Campus) {
  return `${EVENTS_PREFIX}_${campus}`;
}

async function getItem<T>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed: T & { timestamp?: number } = JSON.parse(raw);
    if (parsed.timestamp && Date.now() - parsed.timestamp > maxAgeMs) {
      // 过期则清除
      AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, data: T): Promise<void> {
  try {
    const payload = { ...(data as any), timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // 静默失败，不影响用户体验
  }
}

// ---- 对外接口 ----

// 位置缓存（TTL: 30分钟）—— 只用于地图初始中心，蓝点等 GPS 确认后才显示
const LOCATION_MAX_AGE = 30 * 60 * 1000;

export async function getCachedLocation(): Promise<CachedLocation | null> {
  return getItem<CachedLocation>(LOCATION_KEY, LOCATION_MAX_AGE);
}

export async function setCachedLocation(
  loc: Omit<CachedLocation, "timestamp">
): Promise<void> {
  return setItem(LOCATION_KEY, loc);
}

// 宝箱缓存（TTL: 5分钟）
const DATA_MAX_AGE = 5 * 60 * 1000;

export async function getCachedChests(
  campus: Campus
): Promise<CachedData<CachedChestsPayload> | null> {
  return getItem<CachedData<CachedChestsPayload>>(
    chestsKey(campus),
    DATA_MAX_AGE
  );
}

export async function setCachedChests(
  campus: Campus,
  data: CachedChestsPayload
): Promise<void> {
  return setItem(chestsKey(campus), data);
}

// 活动标记缓存（TTL: 5分钟）
export async function getCachedEvents(
  campus: Campus
): Promise<CachedData<any[]> | null> {
  return getItem<CachedData<any[]>>(eventsKey(campus), DATA_MAX_AGE);
}

export async function setCachedEvents(
  campus: Campus,
  data: any[]
): Promise<void> {
  return setItem(eventsKey(campus), data);
}
