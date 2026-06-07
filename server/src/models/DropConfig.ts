import mongoose, { Document, Schema } from "mongoose";

export interface IDropConfig extends Document {
  chestType: "normal" | "advanced";
  weights: Record<string, number>;
}

const DropConfigSchema = new Schema<IDropConfig>({
  chestType: { type: String, enum: ["normal", "advanced"], required: true, unique: true },
  weights: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const DropConfig = mongoose.model<IDropConfig>("DropConfig", DropConfigSchema);
