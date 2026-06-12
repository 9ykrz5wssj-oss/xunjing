import api from "./api";
import { ApiResponse } from "../types";

export interface FeedbackItem {
  _id: string;
  userId: { _id: string; userId: number; nickname: string; avatar: string; email?: string };
  content: string;
  status: "pending" | "resolved";
  adminReply: string;
  resolvedBy: { _id: string; userId: number; nickname: string } | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** 提交反馈 */
export async function submitFeedback(content: string): Promise<ApiResponse> {
  return api.post("/feedback", { content });
}

/** 获取我的反馈列表 */
export async function getMyFeedback(page = 1, limit = 20): Promise<ApiResponse<FeedbackListResponse>> {
  return api.get("/feedback", { params: { page, limit } });
}

/** 管理员：获取所有反馈 */
export async function getAllFeedback(
  page = 1,
  limit = 20,
  status?: "pending" | "resolved"
): Promise<ApiResponse<FeedbackListResponse>> {
  return api.get("/admin/feedback", { params: { page, limit, status } });
}

/** 管理员：处理反馈 */
export async function resolveFeedback(
  id: string,
  data: { status?: "pending" | "resolved"; adminReply?: string }
): Promise<ApiResponse> {
  return api.put(`/admin/feedback/${id}`, data);
}
