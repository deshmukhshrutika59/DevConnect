// src/utils/embeddingUtils.js
import { pipeline } from "@xenova/transformers";

let embedder = null;

// Load the AI model once
export const loadEmbeddingModel = async () => {
  if (!embedder) {
    console.log("⏳ Loading AI embedding model (Xenova/all-MiniLM-L6-v2)...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ AI embedding model loaded successfully!");
  }
  return embedder;
};

// Generate embeddings for a given text
export const generateEmbedding = async (text) => {
  if (!text || text.trim() === "") return [];
  const model = await loadEmbeddingModel();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};

// Compute cosine similarity
export const cosineSimilarity = (a, b) => {
  if (!a.length || !b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return normA && normB ? dot / (normA * normB) : 0;
};
