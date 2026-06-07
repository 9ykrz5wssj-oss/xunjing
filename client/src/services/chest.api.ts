import api from "./api";
import { ApiResponse, ChestData } from "../types";

export async function getActiveChests(campus: string): Promise<ApiResponse<ChestData[]>> {
  return api.get(`/chests/active?campus=${campus}`);
}
