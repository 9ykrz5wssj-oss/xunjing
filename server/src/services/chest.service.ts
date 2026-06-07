import { Chest } from "../models/Chest";
import { ChestConfig } from "../models/ChestConfig";
import { Campus, ChestType, ChestStatus, CHEST_CONFIG } from "../config/constants";
import { randomPointInCampus } from "../utils/campus";
import { logger } from "../utils/logger";

async function getCampusConfig(campus: Campus): Promise<{ maxNormalChests: number; advancedChance: number }> {
  const cfg = await ChestConfig.findOne({ campus });
  return {
    maxNormalChests: cfg?.maxNormalChests ?? CHEST_CONFIG.MAX_NORMAL_CHESTS_PER_CAMPUS,
    advancedChance: cfg?.advancedChance ?? CHEST_CONFIG.ADVANCED_CHEST_SPAWN_CHANCE,
  };
}

async function spawnChestsForCampus(campus: Campus): Promise<void> {
  const cfg = await getCampusConfig(campus);
  const activeCount = await Chest.countDocuments({ campus, status: ChestStatus.ACTIVE });
  const needed = cfg.maxNormalChests - activeCount;
  if (needed <= 0) return;

  for (let i = 0; i < needed; i++) {
    const coords = await randomPointInCampus(campus);
    const isAdvanced = Math.random() < cfg.advancedChance;
    await Chest.create({
      campus,
      type: isAdvanced ? ChestType.ADVANCED : ChestType.NORMAL,
      coordinates: coords,
      requiredPlayers: isAdvanced ? (2 + Math.floor(Math.random() * 3)) : 1,
      status: ChestStatus.ACTIVE,
      expiresAt: new Date(Date.now() + CHEST_CONFIG.CHEST_MAX_LIFETIME_HOURS * 3600 * 1000),
    });
    logger.info(`[宝箱生成] ${campus} - ${isAdvanced ? "高级" : "普通"}宝箱 at (${coords.lat}, ${coords.lng})`);
  }
}

async function despawnExpiredChests(): Promise<void> {
  const result = await Chest.updateMany(
    { status: ChestStatus.ACTIVE, expiresAt: { $lte: new Date() } },
    { $set: { status: ChestStatus.EXPIRED } }
  );
  if (result.modifiedCount > 0) logger.info(`[宝箱清理] 已过期 ${result.modifiedCount} 个宝箱`);
}

export async function refreshChests(): Promise<void> {
  await despawnExpiredChests();
  await spawnChestsForCampus(Campus.GULOU);
  await spawnChestsForCampus(Campus.XIANLIN);
}

// 5分钟定时补充：如果宝箱不足则补充
export async function topUpChests(): Promise<void> {
  await despawnExpiredChests();
  await spawnChestsForCampus(Campus.GULOU);
  await spawnChestsForCampus(Campus.XIANLIN);
}

export async function initializeChests(): Promise<void> {
  const count = await Chest.countDocuments({ status: ChestStatus.ACTIVE });
  if (count === 0) {
    logger.info("[宝箱初始化] 无活跃宝箱，开始初始生成...");
    await spawnChestsForCampus(Campus.GULOU);
    await spawnChestsForCampus(Campus.XIANLIN);
  } else {
    logger.info(`[宝箱初始化] 已有 ${count} 个活跃宝箱`);
  }
}
