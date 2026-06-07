import mongoose, { Document, Schema } from "mongoose";
import { FriendshipStatus } from "../config/constants";

export interface IFriendship extends Document {
  userId: mongoose.Types.ObjectId;
  friendId: mongoose.Types.ObjectId;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    friendId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(FriendshipStatus),
      default: FriendshipStatus.PENDING,
    },
  },
  { timestamps: true }
);

FriendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });
FriendshipSchema.index({ friendId: 1, status: 1 });
FriendshipSchema.index({ userId: 1, status: 1 });

export const Friendship = mongoose.model<IFriendship>("Friendship", FriendshipSchema);
