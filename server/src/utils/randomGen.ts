import crypto from "crypto";

/**
 * 生成6位数字验证码
 */
export function generateVerifyCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 生成安全的随机Token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * 按权重随机选择数组中的一个元素
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}
