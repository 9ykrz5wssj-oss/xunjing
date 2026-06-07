import mongoose, { Document, Schema } from "mongoose";
import { NotificationType } from "../config/constants";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  referenceId: mongoose.Types.ObjectId | null;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    title: { type: String, default: "", maxlength: 100 },
    body: { type: String, default: "", maxlength: 500 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
