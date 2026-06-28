import { Socket } from "socket.io";
import { Note, NoteStatus } from "../models/Note";
import { getRedis } from "../config/redis";
import { getIO } from "./index";
import { isWithinChestRadius } from "../services/geo.service";

const PICKUP_RADIUS_M = 20;

export async function handlePickupNote(
  socket: Socket,
  user: { userId: string; numericId: number },
  data: { noteId: string }
): Promise<void> {
  const { noteId } = data;
  const redis = getRedis();
  const io = getIO();

  try {
    // 1. 查找纸条
    const note = await Note.findById(noteId);
    if (!note || note.status !== NoteStatus.ACTIVE) {
      socket.emit("pickup_note_result", { noteId, success: false, error: "纸条不存在或已被拾取" });
      return;
    }

    // 2. 获取用户位置
    const locStr = await redis.get(`location:${user.userId}`);
    if (!locStr) {
      socket.emit("pickup_note_result", { noteId, success: false, error: "无法获取您的位置信息" });
      return;
    }
    const [lng, lat] = locStr.split(",").map(Number);

    // 4. 距离检查 (20m)
    if (!(await isWithinChestRadius(lat, lng, note.coordinates.lat, note.coordinates.lng, PICKUP_RADIUS_M))) {
      socket.emit("pickup_note_result", { noteId, success: false, error: "您离纸条太远了，请靠近后再试" });
      return;
    }

    // 5. 标记已拾取
    note.status = NoteStatus.PICKED;
    note.pickedBy = user.userId as any;
    note.pickedAt = new Date();
    await note.save();

    // 6. 清理附近集合
    await redis.del(`note_nearby:${noteId}`);

    // 7. 返回结果给拾取者
    socket.emit("pickup_note_result", {
      noteId,
      success: true,
      data: {
        authorNickname: note.authorNickname,
        authorAvatar: note.authorAvatar,
        authorNumericId: note.authorNumericId,
        content: note.content,
        isAnonymous: note.isAnonymous,
        createdAt: note.createdAt,
        pickedAt: note.pickedAt,
      },
    });

    // 8. 广播移除
    io.emit("note_removed", { noteId });

    // 9. 通知作者（可选）
    if (!note.isAnonymous) {
      io.to(`user:${note.authorId.toString()}`).emit("note_picked", {
        noteId,
        pickedBy: user.numericId,
      });
    }
  } catch (error: any) {
    socket.emit("pickup_note_result", { noteId, success: false, error: "拾取失败，请稍后再试" });
  }
}
