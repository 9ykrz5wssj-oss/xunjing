import { Router } from "express";
import { getActivityPins } from "../controllers/map.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/activity-pins", getActivityPins);

export default router;
