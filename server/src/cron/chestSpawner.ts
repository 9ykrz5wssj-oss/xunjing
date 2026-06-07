import nodeCron from "node-cron";
import { refreshChests, topUpChests } from "../services/chest.service";
import { logger } from "../utils/logger";

export function startChestSpawnerCron(): ReturnType<typeof nodeCron.schedule> {
  // 每5分钟检查补充
  const topUpTask = nodeCron.schedule("*/5 * * * *", async () => {
    try {
      await topUpChests();
    } catch (error) {
      logger.error("[Cron] 宝箱补充失败:", error);
    }
  });

  // 每30分钟完整刷新（清过期+补充）
  const refreshTask = nodeCron.schedule("*/30 * * * *", async () => {
    try {
      await refreshChests();
    } catch (error) {
      logger.error("[Cron] 宝箱刷新失败:", error);
    }
  });

  logger.info("[Cron] 宝箱定时器已启动（补充每5分钟，刷新每30分钟）");
  return topUpTask;
}
