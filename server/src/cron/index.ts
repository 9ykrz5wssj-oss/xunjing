import { startEventStatusCron } from "./eventStatusUpdater";
import { startChestSpawnerCron } from "./chestSpawner";
import { logger } from "../utils/logger";

export function startAllCronJobs(): void {
  startEventStatusCron();
  startChestSpawnerCron();
  logger.info("[Cron] 所有定时任务已启动");
}
