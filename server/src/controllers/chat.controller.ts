import { Response } from "express";
import { AuthRequest } from "../types";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { ConversationType, ContentType } from "../config/constants";
import { getPrivateConversationId, getGroupConversationId } from "../utils/conversationId";

export async function getPrivateChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { friendId } = req.params as { friendId: string };
    const conversationId = getPrivateConversationId(req.user!.userId, friendId);
    const { before, limit = "30" } = req.query;

    const query: any = { conversationId, conversationType: ConversationType.PRIVATE };
    if (before) query.createdAt = { $lt: new Date(before as string) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(+limit)
      .lean();

    const { User } = await import("../models/User");
    const senderIds = [...new Set(messages.map((m: any) => m.senderId).filter(Boolean))];
    const senders = await User.find({ _id: { $in: senderIds } }).select("nickname avatar userId").lean();
    const senderMap: Record<string, any> = {};
    senders.forEach((s: any) => { senderMap[s._id.toString()] = s; });

    res.json({ success: true, data: {
      messages: messages.reverse().map((m: any) => {
        const sid = typeof m.senderId === "string" ? m.senderId : m.senderId?.toString() || "";
        const s = senderMap[sid];
        return {
          senderId: sid,
          senderNickname: s?.nickname || "用户",
          senderAvatar: s?.avatar || "",
          content: m.content,
          contentType: m.contentType,
          createdAt: m.createdAt,
        };
      }),
      conversationId,
    }});
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function sendPrivateMessageREST(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { friendId } = req.params as { friendId: string };
    const { content, contentType } = req.body;
    const conversationId = getPrivateConversationId(req.user!.userId, friendId);
    const sender = await User.findById(req.user!.userId).select("nickname avatar userId");
    const message = await Message.create({
      conversationType: ConversationType.PRIVATE, conversationId,
      senderId: req.user!.userId,
      contentType: contentType || ContentType.TEXT, content,
      readBy: [req.user!.userId],
    });
    res.status(201).json({ success: true, data: {
      senderId: req.user!.userId,
      senderNickname: sender?.nickname || "用户",
      senderAvatar: sender?.avatar || "",
      content, contentType: contentType || ContentType.TEXT,
      createdAt: message.createdAt.toISOString(),
    }});
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
}

export async function sendGroupMessageREST(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { eventId } = req.params as { eventId: string };
    const { content, contentType } = req.body;
    const conversationId = getGroupConversationId(eventId);
    const message = await Message.create({
      conversationType: ConversationType.GROUP, conversationId,
      senderId: req.user!.userId,
      contentType: contentType || ContentType.TEXT, content,
      readBy: [req.user!.userId],
    });
    res.status(201).json({ success: true, data: {
      senderId: req.user!.userId,
      content, contentType: contentType || ContentType.TEXT,
      createdAt: message.createdAt.toISOString(),
    }});
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
}

export async function getGroupChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { eventId } = req.params as { eventId: string };
    const conversationId = getGroupConversationId(eventId);
    const { before, limit = "30" } = req.query;

    const query: any = { conversationId, conversationType: ConversationType.GROUP };
    if (before) query.createdAt = { $lt: new Date(before as string) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(+limit)
      .lean();

    // senderId存的是字符串非ObjectId，手动查用户
    const { User } = await import("../models/User");
    const senderIds = [...new Set(messages.map((m: any) => m.senderId).filter(Boolean))];
    const senders = await User.find({ _id: { $in: senderIds } }).select("nickname avatar userId").lean();
    const senderMap: Record<string, any> = {};
    senders.forEach((s: any) => { senderMap[s._id.toString()] = s; });

    res.json({ success: true, data: {
      messages: messages.reverse().map((m: any) => {
        const sid = typeof m.senderId === "string" ? m.senderId : m.senderId?.toString() || "";
        const s = senderMap[sid];
        return {
          senderId: sid,
          senderNickname: s?.nickname || "用户",
          senderAvatar: s?.avatar || "",
          content: m.content,
          contentType: m.contentType,
          createdAt: m.createdAt,
        };
      }),
      conversationId,
    }});
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
