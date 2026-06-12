import api from "./api";
import { ApiResponse, MessageData } from "../types";

export async function getPrivateChatHistory(friendId: string, before?: string): Promise<ApiResponse<{ messages: MessageData[]; conversationId: string }>> {
  const params = before ? { before } : {};
  return api.get(`/chat/private/${friendId}`, { params });
}

export async function sendPrivateMessage(receiverId: string, content: string): Promise<ApiResponse<MessageData>> {
  return api.post(`/chat/private/${receiverId}`, { content, contentType: "text" });
}

export async function getGroupChatHistory(eventId: string, before?: string): Promise<ApiResponse<{ messages: MessageData[]; conversationId: string }>> {
  const params = before ? { before } : {};
  return api.get(`/chat/group/${eventId}`, { params });
}

export async function revokeMessage(messageId: string): Promise<ApiResponse> {
  return api.post(`/chat/message/${messageId}/revoke`);
}

export async function deleteMessageApi(messageId: string): Promise<ApiResponse> {
  return api.delete(`/chat/message/${messageId}`);
}
