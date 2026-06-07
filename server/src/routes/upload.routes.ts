import { Router } from "express";
import { uploadItemImage } from "../controllers/upload.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.post("/item-image", authMiddleware, adminMiddleware, uploadItemImage);

export default router;
