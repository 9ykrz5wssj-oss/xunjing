import mongoose, { Schema } from "mongoose";

const CounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false }
);

export const Counter = mongoose.model("Counter", CounterSchema);

// 原子自增：获取下一个数字ID
export async function getNextSequence(name: string): Promise<number> {
  const result = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return (result as any).seq;
}
