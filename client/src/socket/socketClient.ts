import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SOCKET_URL = Platform.OS === "web" ? "" : "http://124.222.230.80:3000";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket | null> {
  const token = await AsyncStorage.getItem("token");
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] 已连接:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] 断开:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] 连接错误:", error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getCurrentSocket(): Socket | null {
  return socket;
}
