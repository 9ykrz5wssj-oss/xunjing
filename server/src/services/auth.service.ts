import { getEmailTransporter, isEmailConfigured } from "../config/email";
import { getRedis } from "../config/redis";
import { generateVerifyCode } from "../utils/randomGen";
import { getAdminEmails } from "../config/constants";
import { UserRole } from "../config/constants";
import { signToken } from "../utils/jwt";
import { User } from "../models/User";
import { getNextSequence } from "../models/Counter";
import { logger } from "../utils/logger";
import bcrypt from "bcryptjs";

/**
 * 发送验证码到指定邮箱
 */
export async function sendVerifyCode(email: string): Promise<{ sent: boolean; mockCode?: string }> {
  const code = generateVerifyCode();
  const redis = getRedis();
  const key = `verify:${email}`;

  // 存入Redis，5分钟有效
  await redis.setex(key, 300, code);

  // 如果强制启用SMTP或处于生产环境，发真邮件；否则返回mock
  const forceEmail = process.env.SMTP_ENABLED === "true";

  if (!forceEmail && process.env.NODE_ENV !== "production") {
    logger.warn(`[DEV MODE] 验证码 for ${email}: ${code}`);
    return { sent: true, mockCode: code };
  }

  if (!isEmailConfigured()) {
    logger.error("SMTP未配置");
    throw new Error("邮件服务未配置");
  }

  try {
    const transporter = getEmailTransporter();
    logger.info(`正在发送验证码至 ${email}...`);
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "校园社交与数字收藏 - 登录验证码",
      html: `
        <div style="text-align:center;padding:20px;">
          <h2>🏛️ 校园社交与数字收藏</h2>
          <p>你的登录验证码是：</p>
          <h1 style="color:#FF6B6B;font-size:48px;letter-spacing:8px;">${code}</h1>
          <p>验证码5分钟内有效，请勿泄露给他人。</p>
          <p style="color:#999;">如非本人操作，请忽略此邮件。</p>
        </div>
      `,
    });
    logger.info(`验证码已发送至 ${email}`);
    return { sent: true };
  } catch (error) {
    logger.error(`发送验证码失败: ${email}`, error);
    throw new Error("验证码发送失败，请检查邮箱地址是否正确");
  }
}

/**
 * 验证验证码并登录/注册
 */
export async function verifyAndLogin(email: string, code: string): Promise<{ token: string; isNewUser: boolean }> {
  const redis = getRedis();
  const key = `verify:${email}`;
  const storedCode = await redis.get(key);

  if (!storedCode) {
    throw new Error("验证码已过期，请重新获取");
  }

  if (storedCode !== code) {
    throw new Error("验证码不正确");
  }

  // 验证通过，删除验证码
  await redis.del(key);

  // 查找或创建用户
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // 新用户注册
    const numericId = await getNextSequence("userId");
    const nickname = email.split("@")[0]; // 默认昵称为邮箱前缀
    const adminEmails = getAdminEmails();
    const role = adminEmails.has(email.toLowerCase()) ? UserRole.ADMIN : UserRole.USER;

    user = await User.create({
      email,
      nickname,
      userId: numericId,
      role,
    });

    isNewUser = true;
    logger.info(`新用户注册: ${email}, userId=${numericId}, role=${role}`);
  } else {
    // 已有用户登录：更新角色（预防管理员列表变更）
    const adminEmails = getAdminEmails();
    if (adminEmails.has(email.toLowerCase()) && user.role !== UserRole.ADMIN) {
      user.role = UserRole.ADMIN;
      await user.save();
    }
  }

  // 签发JWT
  const token = signToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    numericId: user.userId,
  });

  // 存储会话到Redis
  await redis.setex(`session:${token}`, 7 * 86400, JSON.stringify({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    numericId: user.userId,
  }));

  return { token, isNewUser };
}

/**
 * 邮箱+密码登录
 */
export async function loginWithPassword(email: string, password: string): Promise<{ token: string }> {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("用户不存在");
  if (!user.password) throw new Error("该账号未设置密码，请使用验证码登录");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("密码错误");

  const token = signToken({
    userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId,
  });
  const redis = getRedis();
  await redis.setex(`session:${token}`, 7 * 86400, JSON.stringify({
    userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId,
  }));
  return { token };
}

/**
 * 设置/修改登录密码
 */
export async function loginByStudentId(studentId: string, password: string): Promise<{ token: string }> {
  const user = await User.findOne({ studentId }).select("+password");
  if (!user) throw new Error("学号不存在或未绑定");
  if (!user.password) throw new Error("该账号未设置密码，请使用验证码登录");
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("密码错误");
  const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId });
  const redis = getRedis();
  await redis.setex(`session:${token}`, 7 * 86400, JSON.stringify({ userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId }));
  return { token };
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  const hashed = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(userId, { password: hashed });
}

/**
 * 登出：清除会话
 */
export async function devLogin(numericId: number): Promise<{ token: string }> {
  const user = await User.findOne({ userId: numericId });
  if (!user) throw new Error("用户不存在");
  const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId });
  const redis = getRedis();
  await redis.setex(`session:${token}`, 7 * 86400, JSON.stringify({ userId: user._id.toString(), email: user.email, role: user.role, numericId: user.userId }));
  return { token };
}

export async function logout(token: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`session:${token}`);
}
