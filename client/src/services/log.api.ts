import api from "./api";
import { ApiResponse, FeedItem } from "../types";

export async function getFeed(before?: string): Promise<ApiResponse<{ feed: FeedItem[]; hasMore: boolean }>> {
  return api.get("/log", { params: before ? { before } : {} });
}
