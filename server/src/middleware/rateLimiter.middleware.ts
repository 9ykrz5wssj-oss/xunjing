import { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis";

/**
 * 通用 Redis 限流中间件工厂
 */
export function rateLimiter(
  keyPrefix: string,
  maxRequests: number,
  windowSeconds: number,
  keyFn?: (req: Request) => string,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedis();
    const identifier = keyFn ? keyFn(req) : ((req as any).user?.userId || req.ip || "unknown");
    const key = `rate:${keyPrefix}:${identifier}`;

    try {
      const current = await redis.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: "操作过于频繁，请稍后再试",
          retryAfter: windowSeconds,
        });
        return;
      }

      if (count === 0) {
        await redis.setex(key, windowSeconds, "1");
      } else {
        await redis.incr(key);
      }

      next();
    } catch (err) {
      // Redis 不可用时放行
      next();
    }
  };
}

// ── 预设限流器 ──

/** 验证码发送：每邮箱每5分钟5次 */
export const verifySendLimiter = rateLimiter("verify_send", 5, 300, (req) => {
  return (req.body?.email || req.ip || "unknown").toString().toLowerCase();
});

/** 验证码校验：每邮箱每5分钟5次 */
export const verifyCheckLimiter = rateLimiter("verify_check", 5, 300);

