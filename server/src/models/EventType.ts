import mongoose, { Document, Schema } from "mongoose";

export interface IEventType extends Document {
  name: string;
  iconUrl: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventTypeSchema = new Schema<IEventType>(
  {
    name: { type: String, required: true, maxlength: 30 },
    iconUrl: { type: String, required: true },
    color: { type: String, default: "#3498DB" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

EventTypeSchema.index({ isActive: 1 });

export const EventType = mongoose.model<IEventType>("EventType", EventTypeSchema);
