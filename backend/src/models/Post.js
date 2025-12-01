import mongoose from "mongoose";
import { generateEmbedding } from "../utils/embeddingUtils.js";

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "video"], default: "image" },
});

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    media: [mediaSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],

    // 🔍 Added for semantic search
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

// 🧠 Generate embedding before saving post
postSchema.pre("save", async function (next) {
  try {
    if (this.isModified("content") || this.isModified("title")) {
      const text = `${this.title} ${this.content}`;
      this.embedding = await generateEmbedding(text);
      console.log(`✅ Generated embedding for Post: ${this.title || this._id}`);
    }
    next();
  } catch (err) {
    console.error("❌ Error generating embedding for Post:", err);
    next(err);
  }
});

const Post = mongoose.model("Post", postSchema);
export default Post;

// import mongoose from "mongoose";

// const mediaSchema = new mongoose.Schema({
//   url: { type: String, required: true },
//   type: { type: String, enum: ["image", "video"], default: "image" },
// });

// const commentSchema = new mongoose.Schema({
//   content: { type: String, required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// const postSchema = new mongoose.Schema(
//   {
//     title: { type: String, default: "" },
//     content: { type: String, default: "" },
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     media: [mediaSchema],
//     likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     comments: [commentSchema],
//      // 🔍 Added for semantic search
//      embedding: {
//       type: [Number],
//       default: [],
//     },
//   },
//   { timestamps: true }
// );

// // module.exports = mongoose.model("Post", postSchema);
// const Post = mongoose.model("Post", postSchema);
// export default Post;
