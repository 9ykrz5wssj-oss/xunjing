import { Router } from "express";
import { getActiveChests } from "../controllers/chest.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/active", getActiveChests);

export default router;
