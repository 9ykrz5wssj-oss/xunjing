import api from "./api";
import { ApiResponse, FriendData, FriendRequest } from "../types";

export async function getFriends(): Promise<ApiResponse<FriendData[]>> {
  return api.get("/friends");
}

export async function sendFriendRequest(targetUserId: number): Promise<ApiResponse> {
  return api.post("/friends/request", { targetUserId });
}

export async function getFriendRequests(): Promise<ApiResponse<FriendRequest[]>> {
  return api.get("/friends/requests");
}

export async function acceptFriendRequest(requestId: string): Promise<ApiResponse> {
  return api.post(`/friends/requests/${requestId}/accept`);
}

export async function rejectFriendRequest(requestId: string): Promise<ApiResponse> {
  return api.post(`/friends/requests/${requestId}/reject`);
}
