import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus-collections";

  try {
    await mongoose.connect(uri);
    console.log("[MongoDB] 连接成功:", uri);
  } catch (error) {
    console.error("[MongoDB] 连接失败:", error);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] 连接异常:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] 连接断开，尝试重连...");
  });
}
