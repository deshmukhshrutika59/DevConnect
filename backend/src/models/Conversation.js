// // backend/src/models/Conversation.js

// const mongoose = require("mongoose");
import mongoose from "mongoose";


const ConversationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },      // group name
    isGroup: { type: Boolean, default: false },           // DM or group
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  },
  { timestamps: true }
);

// module.exports = mongoose.model("Conversation", ConversationSchema);
const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;