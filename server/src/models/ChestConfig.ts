import mongoose, { Document, Schema } from "mongoose";

export interface IChestConfig extends Document {
  campus: string;
  maxNormalChests: number;
  advancedChance: number;
  updatedAt: Date;
}

const ChestConfigSchema = new Schema<IChestConfig>(
  {
    campus: { type: String, required: true, unique: true },
    maxNormalChests: { type: Number, default: 3, min: 0, max: 10 },
    advancedChance: { type: Number, default: 0.2, min: 0, max: 1 },
  },
  { timestamps: true }
);

export const ChestConfig = mongoose.model<IChestConfig>("ChestConfig", ChestConfigSchema);
