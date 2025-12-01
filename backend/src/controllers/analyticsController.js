import User from "../models/User.js";
import Post from "../models/Post.js";
import Analytics from "../models/Analytics.js";
import OpenAI from "openai";
import mongoose from "mongoose";

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/* -------------------------------------------------------------------------- */
/* 🧮 1. GET USER ANALYTICS (Stats + Charts Data) */
/* -------------------------------------------------------------------------- */
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Basic Counts
    const user = await User.findById(userId).populate("connections");
    const totalPosts = await Post.countDocuments({ user: userId });
    const userPosts = await Post.find({ user: userId });

    const totalLikes = userPosts.reduce((sum, p) => sum + p.likes.length, 0);
    const totalComments = userPosts.reduce((sum, p) => sum + p.comments.length, 0);
    const totalShares = userPosts.reduce((sum, p) => sum + (p.shares || 0), 0);

    const avgEngagement =
      totalPosts === 0
        ? 0
        : (totalLikes + totalComments + totalShares) / totalPosts;

    // 2️⃣ Post Metrics
    const postMetrics = userPosts.map((p) => ({
      title: p.title || "Untitled",
      likes: p.likes.length,
      comments: p.comments.length,
      shares: p.shares || 0,
    }));

    // 3️⃣ Profile Views (Last 30 Days)
    let analytics = await Analytics.findOne({ user: userId });
    if (!analytics) analytics = await Analytics.create({ user: userId });

    const last30DaysViews = analytics.profileViews.filter((v) => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return v.date >= d;
    });

    // 4️⃣ Connection Growth (Last 30 Days)
    const last30Connections = analytics.connectionEvents.filter((v) => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return v.date >= d;
    });

    // 5️⃣ Audience Skills Breakdown
    const skillCount = {};
    user.connections.forEach((conn) => {
      conn.skills?.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    const skillBreakdown = Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({
      stats: {
        totalPosts,
        totalLikes,
        totalComments,
        totalShares,
        totalConnections: user.connections.length,
        avgEngagement,
      },
      postMetrics,
      views30: last30DaysViews,
      connections30: last30Connections,
      skillBreakdown,
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* 🤖 2. GENERATE AI INSIGHTS (with 7-Day Caching + Fallback Mode) */
/* -------------------------------------------------------------------------- */
export const generateInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 🟦 1. Find or create analytics doc
    let analytics = await Analytics.findOne({ user: userId });
    if (!analytics) {
      analytics = await Analytics.create({
        user: userId,
        profileViews: [],
        connectionEvents: [],
        insightsCache: { insights: [], updatedAt: new Date() },
      });
    }

    // 🟦 2. Get posts + user
    const posts = await Post.find({ user: userId });
    const user = await User.findById(userId).populate("connections");

    // 🟦 3. Handle missing user or posts gracefully
    if (!user) {
      return res.json({
        insights: ["User data not found — please re-login."],
        cached: false,
      });
    }

    // 🟦 4. Safe cache access
    const cache = analytics.insightsCache || {};
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (cache.insights?.length && cache.updatedAt && new Date(cache.updatedAt) > sevenDaysAgo) {
      console.log("✅ Using cached insights");
      return res.json({ insights: cache.insights, cached: true });
    }

    // 🟦 5. Compute metrics safely
    const profileViews = Array.isArray(analytics.profileViews)
      ? analytics.profileViews
      : [];
    const last7 = profileViews
      .filter(v => v.date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, v) => sum + (v.count || 0), 0);
    const prev7 = profileViews
      .filter(v => v.date < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .slice(-7)
      .reduce((sum, v) => sum + (v.count || 0), 0);

    const growth =
      prev7 > 0 ? (((last7 - prev7) / prev7) * 100).toFixed(1) : last7 > 0 ? 100 : 0;

    const totalConnections = user.connections?.length || 0;
    const totalPosts = posts.length;
    const avgEngagement =
      totalPosts > 0
        ? posts.reduce(
            (sum, p) => sum + (p.likes?.length || 0) + (p.comments?.length || 0),
            0
          ) / totalPosts
        : 0;

    // 🧠 Topic-level insights
    const topicStats = {};
    posts.forEach(p => {
      const text = `${p.title} ${p.content}`.toLowerCase();
      const engagement = (p.likes?.length || 0) + (p.comments?.length || 0);
      if (text.includes("react")) topicStats.react = (topicStats.react || 0) + engagement;
      if (text.includes("javascript")) topicStats.javascript = (topicStats.javascript || 0) + engagement;
      if (text.includes("node")) topicStats.node = (topicStats.node || 0) + engagement;
    });

    // 🟦 6. Fallback Mode — No OpenAI Key
    if (!openai) {
      const fallbackInsights = [];

      if (growth > 0)
        fallbackInsights.push(`Your profile views increased by ${growth}% this week.`);
      else
        fallbackInsights.push("Your profile views remained steady this week.");

      fallbackInsights.push(
        totalConnections > 10
          ? `You have ${totalConnections} active connections!`
          : `You’re building connections steadily — ${totalConnections} so far.`
      );

      fallbackInsights.push(
        avgEngagement > 5
          ? "Your posts are getting great engagement. Keep sharing!"
          : "Try posting more consistently to increase engagement."
      );

      const topTopic = Object.keys(topicStats).sort(
        (a, b) => topicStats[b] - topicStats[a]
      )[0];
      if (topTopic)
        fallbackInsights.push(
          `Posts mentioning "${topTopic}" get the highest engagement.`
        );

      fallbackInsights.push(
        "AI mode is inactive (no API key). Add one to unlock smarter insights."
      );

      analytics.insightsCache = { insights: fallbackInsights, updatedAt: now };
      await analytics.save();

      return res.json({ insights: fallbackInsights, cached: false, ai: false });
    }

    // 🟦 7. AI Mode (OpenAI API)
    const prompt = `
You are an analytics assistant for a developer platform.
Summarize the user's engagement trends in 4–5 short, friendly insights.

DATA:
- User: ${user.name}
- Profile view growth: ${growth}%
- Avg engagement per post: ${avgEngagement.toFixed(1)}
- Topics engagement: ${JSON.stringify(topicStats, null, 2)}
- Total connections: ${totalConnections}
- Total posts: ${totalPosts}
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const insightsText = aiResponse.choices?.[0]?.message?.content || "";
    const insights = insightsText
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, "").trim());

    analytics.insightsCache = { insights, updatedAt: now };
    await analytics.save();

    res.json({ insights, cached: false, ai: true });
  } catch (error) {
    console.error("❌ AI Insights error:", error);
    res.status(200).json({
      insights: [
        "Unable to fetch AI insights currently.",
        "Fallback mode active — check again later.",
      ],
      cached: false,
      ai: false,
    });
  }
};
