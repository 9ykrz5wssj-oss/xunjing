import { Router } from "express";
import { uploadItemImage, uploadAvatar } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.post("/item-image", authMiddleware, adminMiddleware, uploadItemImage);
router.post("/avatar", authMiddleware, uploadAvatar);

export default router;
