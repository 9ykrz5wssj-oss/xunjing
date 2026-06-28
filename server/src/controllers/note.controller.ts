import { Response } from "express";
import { AuthRequest } from "../types";
import { Note, NoteStatus } from "../models/Note";
import { User } from "../models/User";

// 留下纸条
export async function createNote(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { content, isAnonymous, lat, lng, campus } = req.body;
    const userId = req.user!.userId;

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: "纸条内容不能为空" });
      return;
    }
    if (!lat || !lng || !campus) {
      res.status(400).json({ success: false, error: "缺少位置信息" });
      return;
    }

    const user = await User.findById(userId).select("nickname avatar userId");
    const nickname = isAnonymous ? "匿名" : (user?.nickname || "用户");
    const avatar = isAnonymous ? "" : (user?.avatar || "");

    const note = await Note.create({
      campus,
      coordinates: { lat, lng },
      authorId: userId,
      authorNickname: nickname,
      authorAvatar: avatar,
      authorNumericId: isAnonymous ? 0 : (user?.userId || 0),
      content: content.trim().slice(0, 500),
      isAnonymous: !!isAnonymous,
      status: NoteStatus.ACTIVE,
    });

    res.json({
      success: true,
      data: {
        _id: note._id,
        campus: note.campus,
        coordinates: note.coordinates,
        authorNickname: note.authorNickname,
        content: note.content,
        isAnonymous: note.isAnonymous,
        createdAt: note.createdAt,
        expiresAt: note.expiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 获取活跃纸条（地图展示）
export async function getActiveNotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { campus } = req.query;
    const filter: any = { status: NoteStatus.ACTIVE };
    if (campus) filter.campus = campus;

    const notes = await Note.find(filter)
      .select("campus coordinates authorNickname isAnonymous createdAt expiresAt")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: notes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// 获取我拾取的纸条
export async function getMyNotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const notes = await Note.find({
      pickedBy: userId,
      status: NoteStatus.PICKED,
    })
      .select("authorNickname authorAvatar authorNumericId content isAnonymous pickedAt createdAt")
      .sort({ pickedAt: -1 })
      .limit(200);

    res.json({ success: true, data: notes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
