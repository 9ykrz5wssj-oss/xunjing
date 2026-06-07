import { Router } from "express";
import { getUserByNumericId, updateProfile, getStats, deleteAccount } from "../controllers/user.controller";
import { getOtherUserCollections } from "../controllers/item.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate, schemas } from "../middleware/validate.middleware";

const router = Router();

// 所有用户路由需要认证
router.use(authMiddleware);

// GET /api/v1/user/stats（必须在 /:userId 之前）
router.get("/stats", getStats);

// GET /api/v1/user/:userId/collections（必须在 /:userId 之前）
router.get("/:userId/collections", getOtherUserCollections);

// GET /api/v1/user/:userId
router.get("/:userId", getUserByNumericId);

// PUT /api/v1/user/profile
router.put("/profile", validate(schemas.updateProfile), updateProfile);

// DELETE /api/v1/user/account
router.delete("/account", deleteAccount);

export default router;
