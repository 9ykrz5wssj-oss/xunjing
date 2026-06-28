import mongoose, { Document, Schema } from "mongoose";
import { Campus } from "../config/constants";

export enum NoteStatus {
  ACTIVE = "active",
  PICKED = "picked",
  EXPIRED = "expired",
}

export interface INote extends Document {
  campus: Campus;
  coordinates: { lat: number; lng: number };
  authorId: mongoose.Types.ObjectId;
  authorNickname: string;
  authorAvatar: string;
  authorNumericId: number;
  content: string;
  isAnonymous: boolean;
  status: NoteStatus;
  pickedBy: mongoose.Types.ObjectId | null;
  pickedAt: Date | null;
  expiresAt?: Date;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    campus: { type: String, enum: Object.values(Campus), required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorNickname: { type: String, required: true },
    authorAvatar: { type: String, default: "" },
    authorNumericId: { type: Number, default: 0 },
    content: { type: String, required: true, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(NoteStatus),
      default: NoteStatus.ACTIVE,
    },
    pickedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    pickedAt: { type: Date, default: null },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

NoteSchema.index({ status: 1, campus: 1 });
NoteSchema.index({ authorId: 1, createdAt: -1 });
NoteSchema.index({ pickedBy: 1, pickedAt: -1 });

export const Note = mongoose.model<INote>("Note", NoteSchema);
