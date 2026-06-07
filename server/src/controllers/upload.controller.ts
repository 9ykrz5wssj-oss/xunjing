import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../types";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.diskStorage({
  destination: path.join(UPLOAD_DIR, "items"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
}).single("image");

export function uploadItemImage(req: AuthRequest, res: Response): void {
  upload(req as any, res as any, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ success: false, error: "文件不能超过10MB" });
      } else {
        res.status(400).json({ success: false, error: "上传失败" });
      }
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, error: "请选择图片文件" });
      return;
    }
    const url = `/uploads/items/${req.file.filename}`;
    res.json({ success: true, data: { url } });
  });
}
