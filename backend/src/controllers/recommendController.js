import User from "../models/User.js";
import Post from "../models/Post.js";
import { cosineSimilarity, loadEmbeddingModel, generateEmbedding } from "../utils/embeddingUtils.js";

export const recommendUsers = async (req, res) => {
  try {
    await loadEmbeddingModel();

    const loggedInUser = await User.findById(req.user._id);
    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmbedding = loggedInUser.embedding;
    if (!userEmbedding || userEmbedding.length === 0) {
      return res.status(400).json({ message: "User has no embedding yet" });
    }

    // Get all other users with embeddings
    const allUsers = await User.find({
      _id: { $ne: req.user._id },
      embedding: { $exists: true, $ne: [] },
    });

    let scored = allUsers.map((u) => ({
      user: u,
      score: cosineSimilarity(userEmbedding, u.embedding),
    }));

    // Remove already-connected users
    const connections = loggedInUser.connections?.map((id) => id.toString()) || [];
    scored = scored.filter(u => !connections.includes(u.user._id.toString()));

    // Sort by score
    const topUsers = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => ({
        _id: s.user._id,
        name: s.user.name,
        avatarUrl: s.user.avatarUrl,
        bio: s.user.bio,
        skills: s.user.skills,
        score: s.score,
      }));

    res.json({ results: topUsers });

  } catch (error) {
    console.error("❌ recommendUsers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const recommendedPosts = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      await loadEmbeddingModel();
  
      const userEmbedding = user.embedding;
      if (!userEmbedding || userEmbedding.length === 0) {
        return res.json({ results: [] });
      }
  
      // Get posts (exclude own posts)
      const posts = await Post.find({
        user: { $nin: [userId, ...user.connections] }
      })      
        .populate("user", "name avatarUrl skills techStack")
        .populate("comments.user", "name avatarUrl");
  
      const scored = posts.map((post) => ({
        post,
        score: cosineSimilarity(userEmbedding, post.embedding),
      }));
  
      const sorted = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // top 10
        .map((p) => p.post);
  
      res.json({ results: sorted });
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };