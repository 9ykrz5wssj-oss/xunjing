import { Router } from "express";
import { getActivityPins, getCampusBounds } from "../controllers/map.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/activity-pins", getActivityPins);
router.get("/campus-bounds", getCampusBounds);

export default router;
