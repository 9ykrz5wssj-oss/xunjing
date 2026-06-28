import { Router } from "express";
import { createNote, getActiveNotes, getMyNotes } from "../controllers/note.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/active", getActiveNotes);
router.get("/my", getMyNotes);
router.post("/", createNote);

export default router;
