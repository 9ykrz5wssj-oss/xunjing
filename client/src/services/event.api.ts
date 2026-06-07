import api from "./api";
import { ApiResponse, EventData, EventTypeData } from "../types";

export async function getEventTypes(): Promise<ApiResponse<EventTypeData[]>> {
  return api.get("/event-types");
}

export async function createEvent(data: any): Promise<ApiResponse<EventData>> {
  return api.post("/events", data);
}

export async function getMyEvents(): Promise<ApiResponse<any[]>> {
  return api.get("/events/my");
}

export async function getEventDetail(id: string): Promise<ApiResponse<any>> {
  return api.get(`/events/${id}`);
}

export async function applyToEvent(eventId: string): Promise<ApiResponse> {
  return api.post(`/events/${eventId}/apply`);
}

export async function stopRecruiting(eventId: string): Promise<ApiResponse> {
  return api.post(`/events/${eventId}/stop-recruiting`);
}

export async function cancelEvent(eventId: string): Promise<ApiResponse> {
  return api.post(`/events/${eventId}/cancel`);
}

export async function exitEvent(eventId: string): Promise<ApiResponse> {
  return api.post(`/events/${eventId}/exit`);
}
