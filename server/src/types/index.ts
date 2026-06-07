import { Request } from "express";

// JWT payload
export interface JwtPayload {
  userId: string;    // MongoDB ObjectId
  email: string;
  role: string;
  numericId: number; // 用户的数字ID
}

// Express Request with user info attached by auth middleware
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API 统一响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页参数
export interface PaginationQuery {
  page?: number;
  limit?: number;
  before?: string;  // 游标分页
}

// 日志Feed条目类型
export type FeedItemType = "activity" | "collection";

export interface FeedItem {
  type: FeedItemType;
  timestamp: Date;
  data: Record<string, any>;
}
