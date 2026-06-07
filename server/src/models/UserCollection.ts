import mongoose, { Document, Schema } from "mongoose";

export interface IUserCollection extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  count: number;
  acquiredAt: Date;
  lastAcquiredAt: Date;
}

const UserCollectionSchema = new Schema<IUserCollection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    count: { type: Number, default: 1, min: 0 },
    acquiredAt: { type: Date, default: Date.now },
    lastAcquiredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

UserCollectionSchema.index({ userId: 1, itemId: 1 }, { unique: true });
UserCollectionSchema.index({ userId: 1, count: 1 });

export const UserCollection = mongoose.model<IUserCollection>(
  "UserCollection",
  UserCollectionSchema
);
