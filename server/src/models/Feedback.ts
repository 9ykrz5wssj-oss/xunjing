import mongoose, { Document, Schema } from "mongoose";

export type FeedbackStatus = "pending" | "resolved";

export interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  status: FeedbackStatus;
  adminReply: string;
  resolvedBy: mongoose.Types.ObjectId | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    adminReply: { type: String, default: "", maxlength: 1000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
