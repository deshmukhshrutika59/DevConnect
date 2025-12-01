import mongoose from "mongoose";

const mentorMessageSchema = new mongoose.Schema({
  senderType: { type: String, enum: ["user","assistant","system"], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser", required: false },
  content: { type: String, required: true },
  meta: { type: Object, default: {} },
}, { timestamps: true });

const MentorConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "AuthUser", required: true },
  title: { type: String },
  messages: [mentorMessageSchema],
  contextSnapshot: { type: Object, default: {} }, // optional: store resumes, github summary, top langs etc.
}, { timestamps: true });

export default mongoose.model("MentorConversation", MentorConversationSchema);
