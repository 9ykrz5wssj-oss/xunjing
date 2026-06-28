import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { getRedis } from "../config/redis";
import { logger } from "../utils/logger";
import { ClientToServerEvents, ServerToClientEvents } from "../types/socket";
import { handleLocationUpdate } from "./location.handler";
import { handleChestOpenRequest } from "./chest.handler";
import { handlePrivateMessage, handleGroupMessage, handleTyping, handleMarkRead } from "./chat.handler";
import { handlePickupNote } from "./note.handler";

let io: Server;

export function getIO(): Server {
  return io;
}

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ── 认证中间件 ──
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string;

    if (!token) {
      return next(new Error("未提供认证Token"));
    }

    try {
      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch (err) {
      next(new Error("Token无效"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const user = (socket as any).user;
    const redis = getRedis();

    logger.info(`[Socket] 用户连接: ${user.numericId} (${socket.id})`);

    // 加入个人房间
    socket.join(`user:${user.userId}`);

    // 注册在线状态
    await redis.setex(`online:${user.userId}`, 120, socket.id);
    await redis.set(`socket:${socket.id}`, user.userId);

    // 通知客户端认证成功
    socket.emit("authenticated", {
      userId: user.userId,
      numericId: user.numericId,
    });

    // ── 事件处理 ──
    socket.on("location_update", (data) => handleLocationUpdate(socket, user, data));
    socket.on("chest_open_request", (data) => handleChestOpenRequest(socket, user, data));
    socket.on("private_message", (data) => handlePrivateMessage(socket, user, data));
    socket.on("group_message", (data) => handleGroupMessage(socket, user, data));
    socket.on("typing_start", (data) => handleTyping(socket, user, data, true));
    socket.on("typing_end", (data) => handleTyping(socket, user, data, false));
    socket.on("mark_read", (data) => handleMarkRead(socket, user, data));
    socket.on("join_event_chat", (data) => {
      socket.join(`event:${data.eventId}`);
      logger.debug(`[Socket] ${user.numericId} joined event chat: ${data.eventId}`);
    });
    socket.on("leave_event_chat", (data) => {
      socket.leave(`event:${data.eventId}`);
      logger.debug(`[Socket] ${user.numericId} left event chat: ${data.eventId}`);
    });
    socket.on("pickup_note", (data) => handlePickupNote(socket, user, data));

    // ── 断开连接 ──
    socket.on("disconnect", async () => {
      logger.info(`[Socket] 用户断开: ${user.numericId}`);

      // 清理在线状态
      await redis.del(`online:${user.userId}`);
      await redis.del(`socket:${socket.id}`);

      // 从所有宝箱附近集合中移除
      const chestKeys = await redis.keys("chest_nearby:*");
      for (const key of chestKeys) {
        await redis.srem(key, user.userId.toString());
      }
      // 从所有纸条附近集合中移除
      const noteKeys = await redis.keys("note_nearby:*");
      for (const key of noteKeys) {
        await redis.srem(key, user.userId.toString());
      }
    });
  });

  logger.info("[Socket.IO] 初始化完成");
  return io;
}
