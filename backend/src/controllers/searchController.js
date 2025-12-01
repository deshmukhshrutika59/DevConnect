
import User from "../models/User.js";
import { generateEmbedding, cosineSimilarity, loadEmbeddingModel } from "../utils/embeddingUtils.js";

export const semanticSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.json([]);

    await loadEmbeddingModel();
    const queryEmbedding = await generateEmbedding(query);

    // 1️⃣ KEYWORD SEARCH
    const regex = new RegExp(query, "i");
    const keywordMatches = await User.find({
      $or: [
        { name: regex },
        { bio: regex },
        { skills: regex },
        { techStack: regex }
      ]
    });

    // 2️⃣ SEMANTIC SEARCH
    const semanticCandidates = await User.find({
      embedding: { $exists: true, $ne: [] }
    });

    const semanticScored = semanticCandidates.map(u => ({
      user: u,
      score: cosineSimilarity(queryEmbedding, u.embedding)
    }));

    const semanticMatches = semanticScored
      .filter(s => s.score >= 0.30) // semantic threshold
      .sort((a, b) => b.score - a.score)
      .map(s => s.user);

    // 3️⃣ MERGE BOTH (unique)
    const final = new Map();
    keywordMatches.forEach(u => final.set(u._id.toString(), u));
    semanticMatches.forEach(u => final.set(u._id.toString(), u));

    res.json(Array.from(final.values()));

  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
