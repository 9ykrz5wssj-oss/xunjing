import { Router } from "express";
import { getDashboard, createChest, getCampusBounds, updateCampusBounds, listChests, removeChest, giftItem, refreshAllChests, getChestConfig, updateChestConfig } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/dashboard", getDashboard);
router.post("/chests", createChest);
router.get("/chests", listChests);
router.delete("/chests/:id", removeChest);
router.post("/refresh-chests", refreshAllChests);
router.get("/chest-config", getChestConfig);
router.put("/chest-config", updateChestConfig);
router.post("/gift-item", giftItem);
router.get("/campus-bounds", getCampusBounds);
router.put("/campus-bounds", updateCampusBounds);

export default router;
