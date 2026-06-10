import { Request, Response } from "express";
import { sendVerifyCode, verifyAndLogin, logout, loginWithPassword, loginByStudentId, setUserPassword, devLogin } from "../services/auth.service";
import { AuthRequest } from "../types";
import { getAllowedEmailDomains } from "../config/constants";

/**
 * POST /api/v1/auth/send-code
 * 发送验证码
 */
export async function sendCode(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 验证邮箱域名
    const allowedDomains = getAllowedEmailDomains();
    const domain = normalizedEmail.split("@")[1];
    if (!domain || !allowedDomains.includes(domain)) {
      res.status(400).json({
        success: false,
        error: "仅支持南京大学邮箱注册（@smail.nju.edu.cn 或 @nju.edu.cn）",
      });
      return;
    }

    const result = await sendVerifyCode(normalizedEmail);

    res.json({
      success: true,
      message: "验证码已发送",
      // 开发环境返回mock验证码（生产环境不返回）
      ...(result.mockCode && { mockCode: result.mockCode }),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "验证码发送失败",
    });
  }
}

/**
 * POST /api/v1/auth/verify-login
 * 验证验证码并登录/注册
 */
export async function verifyLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const { token, isNewUser } = await verifyAndLogin(normalizedEmail, code);

    res.json({
      success: true,
      data: {
        token,
        isNewUser,
      },
      message: isNewUser ? "注册成功！欢迎加入" : "登录成功！",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || "登录验证失败",
    });
  }
}

/**
 * POST /api/v1/auth/logout
 * 退出登录
 */
export async function logoutHandler(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await logout(token);
    }
    res.json({ success: true, message: "已退出登录" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v1/auth/me
 * 获取当前用户信息
 */
/**
 * POST /api/v1/auth/login-password
 * 邮箱+密码登录
 */
export async function loginByStudentIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) { res.status(400).json({ success: false, error: "请输入学号和密码" }); return; }
    const { token } = await loginByStudentId(studentId, password);
    res.json({ success: true, data: { token, isNewUser: false }, message: "登录成功！" });
  } catch (error: any) { res.status(400).json({ success: false, error: error.message || "登录失败" }); }
}

export async function loginByPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const { token } = await loginWithPassword(normalizedEmail, password);
    res.json({ success: true, data: { token, isNewUser: false }, message: "登录成功！" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "登录失败" });
  }
}

/**
 * POST /api/v1/auth/set-password
 * 设置/修改登录密码
 */
export async function setPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400).json({ success: false, error: "密码至少6位" }); return;
    }
    await setUserPassword(req.user!.userId, password);
    res.json({ success: true, message: "密码设置成功" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { User } = await import("../models/User");
    const user = await User.findById(req.user!.userId).select("-__v");

    if (!user) {
      res.status(404).json({ success: false, error: "用户不存在" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function devLoginHandler(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;
    if (!userId) { res.status(400).json({ success: false, error: "需要userId" }); return; }
    const { token } = await devLogin(Number(userId));
    res.json({ success: true, data: { token, isNewUser: false }, message: "快捷登录成功" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || "快捷登录失败" });
  }
}
