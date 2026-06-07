import { Router } from "express";
import { listEventTypes, createEventType, updateEventType, deleteEventType } from "../controllers/eventType.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", listEventTypes);
router.post("/", adminMiddleware, createEventType);
router.put("/:id", adminMiddleware, updateEventType);
router.delete("/:id", adminMiddleware, deleteEventType);

export default router;
