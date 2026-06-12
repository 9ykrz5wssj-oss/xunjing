import mongoose, { Document, Schema } from "mongoose";
import { ConversationType, ContentType } from "../config/constants";

export interface IMessage extends Document {
  conversationType: ConversationType;
  conversationId: string;
  senderId: mongoose.Types.ObjectId;
  contentType: ContentType;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  isRevoked: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationType: {
      type: String,
      enum: Object.values(ConversationType),
      required: true,
    },
    conversationId: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contentType: {
      type: String,
      enum: Object.values(ContentType),
      default: ContentType.TEXT,
    },
    content: { type: String, required: true, maxlength: 2000 },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
