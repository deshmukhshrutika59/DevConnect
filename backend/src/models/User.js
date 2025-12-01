import mongoose from "mongoose";
import { generateEmbedding } from "../utils/embeddingUtils.js";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    avatarUrl: String,
    bio: String,
    location: String,
    experienceLevel: String,
    githubUsername: String,
    techStack: [String],
    skills: [String],
    education: String,
    socialLinks: Object,
    embedding: {
      type: [Number],
      default: [],
    },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// 🧠 Generate embedding before saving user
userSchema.pre("save", async function (next) {
  try {
    if (
      this.isModified("name") ||
      this.isModified("bio") ||
      this.isModified("skills") ||
      this.isModified("techStack")
    ) {
      const text = `${this.name} ${this.bio || ""} ${(this.skills || []).join(" ")} ${(this.techStack || []).join(" ")}`;
      this.embedding = await generateEmbedding(text);
      console.log(`🧠 Generated embedding for User: ${this.name}`);
    }
    next();
  } catch (err) {
    console.error("❌ Error generating user embedding:", err);
    next(err);
  }
});

const User = mongoose.model("User", userSchema);
export default User;
