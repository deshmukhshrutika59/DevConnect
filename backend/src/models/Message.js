// backend/src/models/Message.js
import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    mimeType: { type: String, default: null },
    filename: { type: String, default: null },
    size: { type: Number, default: null },
  },
  { _id: false }
);

const SharedPostSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    originalAuthorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    originalAuthorName: { type: String },
    title: { type: String },
    content: { type: String },
    media: [{ type: String }],
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    content: { type: String, default: "" },
    media: { type: MediaSchema, default: null },

    // ✅ New fields
    type: {
      type: String,
      enum: ["text", "media", "shared_post"],
      default: "text",
    },
    sharedPost: { type: SharedPostSchema, default: null },
    comment: { type: String, default: "" },

    editableUntil: { type: Date, default: null },
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    delivered: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// module.exports = mongoose.model("Message", MessageSchema);
const Message = mongoose.model("Message", MessageSchema);
export default Message;