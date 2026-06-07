import api from "./api";
import { ApiResponse, UserProfile } from "../types";

export async function sendVerifyCode(email: string): Promise<ApiResponse<{ mockCode?: string }>> {
  return api.post("/auth/send-code", { email });
}

export async function verifyLogin(email: string, code: string): Promise<ApiResponse<{ token: string; isNewUser: boolean }>> {
  return api.post("/auth/verify-login", { email, code });
}

export async function loginWithPassword(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  return api.post("/auth/login-password", { email, password });
}

export async function setPassword(password: string): Promise<ApiResponse> {
  return api.post("/auth/set-password", { password });
}

export async function logout(): Promise<ApiResponse> {
  return api.post("/auth/logout");
}

export async function getMe(): Promise<ApiResponse<UserProfile>> {
  return api.get("/auth/me");
}
