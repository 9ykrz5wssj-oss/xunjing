import mongoose, { Document, Schema } from "mongoose";
import { Campus, ChestType, ChestStatus } from "../config/constants";

export interface IChest extends Document {
  campus: Campus;
  type: ChestType;
  coordinates: {
    lat: number;
    lng: number;
  };
  requiredPlayers: number;
  status: ChestStatus;
  openedBy: mongoose.Types.ObjectId | null;
  openedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const ChestSchema = new Schema<IChest>(
  {
    campus: { type: String, enum: Object.values(Campus), required: true },
    type: { type: String, enum: Object.values(ChestType), required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    requiredPlayers: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(ChestStatus),
      default: ChestStatus.ACTIVE,
    },
    openedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    openedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ChestSchema.index({ status: 1, campus: 1 });
ChestSchema.index({ campus: 1, status: 1, type: 1 });

export const Chest = mongoose.model<IChest>("Chest", ChestSchema);
