import mongoose, { Schema } from "mongoose";

// 校区边界配置（管理员可修改）
const CampusConfigSchema = new Schema({
  campus: { type: String, enum: ["gulou", "xianlin", "suzhou"], required: true, unique: true },
  minLng: { type: Number, required: true },
  maxLng: { type: Number, required: true },
  minLat: { type: Number, required: true },
  maxLat: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const CampusConfig = mongoose.model("CampusConfig", CampusConfigSchema);

// 获取所有校区配置
export async function getCampusConfigs(): Promise<Record<string, { minLng: number; maxLng: number; minLat: number; maxLat: number }>> {
  const configs = await CampusConfig.find();
  const result: any = {};
  for (const c of configs) {
    result[c.campus] = { minLng: c.minLng, maxLng: c.maxLng, minLat: c.minLat, maxLat: c.maxLat };
  }
  return result;
}
