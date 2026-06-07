import api from "./api";
import { ApiResponse, UserProfile, UserStats, PublicUser } from "../types";

export async function getUserByNumericId(userId: number): Promise<ApiResponse<PublicUser>> {
  return api.get(`/user/${userId}`);
}

export async function updateProfile(data: { nickname?: string; avatar?: string }): Promise<ApiResponse<UserProfile>> {
  return api.put("/user/profile", data);
}

export async function getStats(): Promise<ApiResponse<UserStats>> {
  return api.get("/user/stats");
}

export async function deleteAccount(): Promise<ApiResponse> {
  return api.delete("/user/account");
}
