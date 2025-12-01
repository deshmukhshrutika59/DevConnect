// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Core function that talks to Gemini.
 * You can later feed resume / GitHub / analytics context here.
 */
export async function getAiReply({ message, user }) {
  const safeName = user?.name || "Developer";

  const systemPrompt = `
You are DevConnect AI Assistant.

- Audience: developers using DevConnect to improve their career.
- You can help with: career guidance, resume tips, GitHub projects, networking, interview prep, and DevConnect features.
- Be concise, practical, and encouraging.
- If the user asks about something DevConnect doesn't have, suggest realistic things they CAN do.
`;

  const prompt = `
${systemPrompt}

User name: ${safeName}
User message: ${message}
Reply in clear markdown. Keep paragraphs short.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
