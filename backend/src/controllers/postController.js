import Post from "../models/Post.js";
import { generateEmbedding } from "../utils/embeddingUtils.js";
import { createNotification } from "../services/notificationService.js";
import { sendRealtimeNotification } from "../utils/socketNotifications.js";

export const createPost = async (req, res) => {
  try {
    const post = await Post.create({ ...req.body, user: req.user._id });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const allowedUsers = [...req.user.connections, userId];

    const posts = await Post.find({ user: { $in: allowedUsers } })
      .populate("user", "name avatarUrl bio skills")
      .populate("comments.user", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Feed Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      await post.save();
      return res.json({ liked: false, likes: post.likes.length });
    }

    // Like
    post.likes.push(userId);
    await post.save();

    // 🔔 CREATE NOTIFICATION for post owner
    if (post.user.toString() !== userId) {
      const notif = await createNotification({
        user: post.user, // receiver → owner
        sender: req.user._id,
        type: "like",
        message: `${req.user.name} liked your post`,
        link: `/post/${post._id}`,
      });

      // socket.io push
      const io = req.app.get("io");
      sendRealtimeNotification(io, post.user, notif);
    }

    res.json({ liked: true, likes: post.likes.length });

  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
