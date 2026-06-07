const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const currentLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel);
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (msg: string, ...args: any[]) => {
    if (shouldLog("debug")) console.debug(`[${timestamp()}] [DEBUG] ${msg}`, ...args);
  },
  info: (msg: string, ...args: any[]) => {
    if (shouldLog("info")) console.log(`[${timestamp()}] [INFO] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    if (shouldLog("warn")) console.warn(`[${timestamp()}] [WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    if (shouldLog("error")) console.error(`[${timestamp()}] [ERROR] ${msg}`, ...args);
  },
};
