// const mongoose = require("mongoose");
import mongoose from "mongoose";


const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  content: { type: String, required: true },
}, { timestamps: true });

// module.exports = mongoose.model("Comment", commentSchema);
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;