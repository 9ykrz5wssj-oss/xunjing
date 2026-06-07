import { Router } from "express";
import { getFeed } from "../controllers/log.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", getFeed);

export default router;
