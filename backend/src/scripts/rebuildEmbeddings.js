import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { generateEmbedding } from "../utils/embeddingUtils.js";

dotenv.config();

const rebuildEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const posts = await Post.find();
    for (const post of posts) {
      const text = `${post.title} ${post.content}`;
      post.embedding = await generateEmbedding(text);
      await post.save();
      console.log(`🧠 Updated Post embedding: ${post._id}`);
    }

    const users = await User.find();
    for (const user of users) {
      const text = `${user.name} ${user.bio || ""} ${(user.skills || []).join(" ")} ${(user.techStack || []).join(" ")}`;
      user.embedding = await generateEmbedding(text);
      await user.save();
      console.log(`🧠 Updated User embedding: ${user._id}`);
    }

    console.log("✅ Embedding rebuild completed!");
    await mongoose.connection.close(); // 🔥 required for ES modules
    process.exit(0);

  } catch (error) {
    console.error("❌ Error in embedding rebuild:", error);
    process.exit(1);
  }
};

rebuildEmbeddings();
