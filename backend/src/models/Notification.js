import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser", required: true }, // receiver
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser" }, // who triggered it
    type: {
      type: String,
      enum: ["like", "comment", "message", "follow", "system"],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: null }, // optional: e.g. "/post/123"
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
