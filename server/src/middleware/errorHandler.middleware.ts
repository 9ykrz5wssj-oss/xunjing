import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Unhandled error:", err.message, err.stack);

  // Mongoose 验证错误
  if (err.name === "ValidationError") {
    res.status(400).json({
      success: false,
      error: "数据验证失败",
      details: err.message,
    });
    return;
  }

  // Mongoose 重复键错误
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: "数据已存在",
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "服务器内部错误" : err.message,
  });
}
