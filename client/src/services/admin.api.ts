import api from "./api";
import { ApiResponse, ItemDetail, EventTypeData } from "../types";

// ── 藏品管理 ──
export async function listItems(page = 1, limit = 20, rarity?: string): Promise<ApiResponse<{ items: ItemDetail[]; total: number }>> {
  return api.get("/items", { params: { page, limit, rarity } });
}

export async function createItem(data: { name: string; description: string; rarity: string; imageUrl: string; dropWeight: number }): Promise<ApiResponse<ItemDetail>> {
  return api.post("/items", data);
}

export async function updateItem(id: string, data: Partial<ItemDetail>): Promise<ApiResponse<ItemDetail>> {
  return api.put(`/items/${id}`, data);
}

export async function deleteItem(id: string): Promise<ApiResponse> {
  return api.delete(`/items/${id}`);
}

// ── 活动类型管理 ──
export async function listEventTypes(): Promise<ApiResponse<EventTypeData[]>> {
  return api.get("/event-types");
}

export async function createEventType(data: { name: string; iconUrl: string; sortOrder?: number }): Promise<ApiResponse<EventTypeData>> {
  return api.post("/event-types", data);
}

export async function updateEventType(id: string, data: Partial<EventTypeData>): Promise<ApiResponse<EventTypeData>> {
  return api.put(`/event-types/${id}`, data);
}

export async function deleteEventType(id: string): Promise<ApiResponse> {
  return api.delete(`/event-types/${id}`);
}

// ── 仪表盘 ──
export async function getDashboard(): Promise<ApiResponse<{ totalUsers: number; activeChests: number; activeEvents: number }>> {
  return api.get("/admin/dashboard");
}

// ── 赠送藏品 ──
export async function giftItem(userId: number, itemId: string): Promise<ApiResponse> {
  return api.post("/admin/gift-item", { userId, itemId });
}
