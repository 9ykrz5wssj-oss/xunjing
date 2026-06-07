import mongoose, { Document, Schema } from "mongoose";
import { Rarity } from "../config/constants";

export interface IItem extends Document {
  name: string;
  description: string;
  rarity: Rarity;
  imageUrl: string;
  dropWeight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, maxlength: 50 },
    description: { type: String, default: "", maxlength: 500 },
    rarity: {
      type: String,
      enum: Object.values(Rarity),
      required: true,
    },
    imageUrl: { type: String, required: true },
    dropWeight: { type: Number, default: 1.0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ItemSchema.index({ rarity: 1 });
ItemSchema.index({ isActive: 1, rarity: 1 });

export const Item = mongoose.model<IItem>("Item", ItemSchema);
