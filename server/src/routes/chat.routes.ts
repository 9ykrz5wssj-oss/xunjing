import { Router } from "express";
import { getPrivateChatHistory, getGroupChatHistory, sendPrivateMessageREST, sendGroupMessageREST } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/private/:friendId", getPrivateChatHistory);
router.post("/private/:friendId", sendPrivateMessageREST);
router.get("/group/:eventId", getGroupChatHistory);
router.post("/group/:eventId", sendGroupMessageREST);

export default router;
