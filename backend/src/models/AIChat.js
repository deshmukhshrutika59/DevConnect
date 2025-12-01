import mongoose from "mongoose";

const AiChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        from: { type: String, enum: ["user", "bot"] },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("AiChat", AiChatSchema);
