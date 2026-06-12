import { Router } from "express";
import { createFeedback, getMyFeedback } from "../controllers/feedback.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

// 提交反馈
router.post("/", createFeedback);
// 获取我的反馈列表
router.get("/", getMyFeedback);

export default router;
