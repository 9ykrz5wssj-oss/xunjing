import api from "./api";
import { ApiResponse, NoteData } from "../types";

export async function getActiveNotes(campus: string): Promise<ApiResponse<NoteData[]>> {
  return api.get(`/notes/active?campus=${campus}`);
}

export async function createNote(data: {
  content: string;
  isAnonymous: boolean;
  lat: number;
  lng: number;
  campus: string;
}): Promise<ApiResponse<NoteData>> {
  return api.post("/notes", data);
}

export async function getMyNotes(): Promise<ApiResponse<NoteData[]>> {
  return api.get("/notes/my");
}
