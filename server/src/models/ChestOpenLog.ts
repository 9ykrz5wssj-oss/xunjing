import mongoose, { Document, Schema } from "mongoose";
import { ChestType, Rarity } from "../config/constants";

export interface IChestOpenLog extends Document {
  userId: mongoose.Types.ObjectId;
  chestId: mongoose.Types.ObjectId;
  chestType: ChestType;
  itemDroppedId: mongoose.Types.ObjectId;
  itemDroppedRarity: Rarity;
  openedAt: Date;
}

const ChestOpenLogSchema = new Schema<IChestOpenLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chestId: { type: Schema.Types.ObjectId, ref: "Chest", required: true },
    chestType: { type: String, enum: Object.values(ChestType), required: true },
    itemDroppedId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    itemDroppedRarity: {
      type: String,
      enum: Object.values(Rarity),
      required: true,
    },
    openedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ChestOpenLogSchema.index({ userId: 1, openedAt: -1 });
ChestOpenLogSchema.index({ userId: 1, chestType: 1, openedAt: -1 });

export const ChestOpenLog = mongoose.model<IChestOpenLog>("ChestOpenLog", ChestOpenLogSchema);
