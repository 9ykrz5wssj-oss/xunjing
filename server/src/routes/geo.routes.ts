import { Router } from "express";
import { ipLocation } from "../controllers/geo.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.get("/ip-location", authMiddleware, ipLocation);
export default router;
