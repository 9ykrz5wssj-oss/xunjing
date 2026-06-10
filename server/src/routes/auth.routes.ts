import { Router } from "express";
import { sendCode, verifyLogin, logoutHandler, getMe, loginByPassword, loginByStudentIdHandler, setPassword, devLoginHandler } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate, schemas } from "../middleware/validate.middleware";
import { verifySendLimiter, verifyCheckLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// POST /api/v1/auth/send-code
router.post("/send-code", verifySendLimiter, validate(schemas.sendCode), sendCode);

// POST /api/v1/auth/verify-login
router.post("/verify-login", verifyCheckLimiter, validate(schemas.verifyLogin), verifyLogin);

// POST /api/v1/auth/dev-login
router.post("/dev-login", devLoginHandler);

// POST /api/v1/auth/login-student
router.post("/login-student", loginByStudentIdHandler);

// POST /api/v1/auth/login-password
router.post("/login-password", loginByPassword);

// POST /api/v1/auth/set-password
router.post("/set-password", authMiddleware, setPassword);

// POST /api/v1/auth/logout
router.post("/logout", authMiddleware, logoutHandler);

// GET /api/v1/auth/me
router.get("/me", authMiddleware, getMe);

export default router;
