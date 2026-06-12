import { Router } from "express";
import { getPrivateChatHistory, getGroupChatHistory, sendPrivateMessageREST, sendGroupMessageREST, revokeMessage, deleteMessage } from "../controllers/chat.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/private/:friendId", getPrivateChatHistory);
router.post("/private/:friendId", sendPrivateMessageREST);
router.get("/group/:eventId", getGroupChatHistory);
router.post("/group/:eventId", sendGroupMessageREST);
router.post("/message/:messageId/revoke", revokeMessage);
router.delete("/message/:messageId", deleteMessage);

export default router;
