import Redis from "ioredis";

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    redis = new Redis(url, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on("connect", () => {
      console.log("[Redis] 连接成功:", url);
    });

    redis.on("error", (err) => {
      console.error("[Redis] 连接异常:", err.message);
    });
  }
  return redis;
}
