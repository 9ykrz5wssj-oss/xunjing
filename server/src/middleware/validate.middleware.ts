import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * 请求体验证中间件工厂
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "请求参数有误",
        details: result.error.format(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

// ── 常用验证Schema ──

export const schemas = {
  sendCode: z.object({
    email: z
      .string()
      .email("邮箱格式不正确")
      .refine(
        (email) => {
          const domains = (process.env.ALLOWED_EMAIL_DOMAINS || "smail.nju.edu.cn,nju.edu.cn").split(",");
          return domains.some((d) => email.toLowerCase().endsWith("@" + d.trim()));
        },
        { message: "仅支持南京大学邮箱注册" }
      ),
  }),

  verifyLogin: z.object({
    email: z.string().email(),
    code: z.string().length(6, "验证码为6位数字"),
  }),

  updateProfile: z.object({
    nickname: z.string().min(1).max(20).optional(),
    avatar: z.string().url().optional(),
    studentId: z.string().max(20).optional(),
  }),

  createEvent: z.object({
    title: z.string().optional(),
    typeId: z.string().min(1, "请选择活动类型"),
    startTime: z.string().min(1, "请选择开始时间"),
    endTime: z.string().min(1, "请选择结束时间"),
    capacity: z.number().int().positive("容纳人数必须为正整数"),
    campus: z.enum(["gulou", "xianlin", "suzhou"], { message: "请选择校区" }),
    locationText: z.string().min(1, "请填写具体地点"),
    meetCoordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    description: z.string().optional(),
  }),

  sendFriendRequest: z.object({
    targetUserId: z.number().int().positive(),
  }),
};
