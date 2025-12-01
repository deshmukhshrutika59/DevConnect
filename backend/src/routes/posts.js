import express from "express";
import auth from "../middleware/authMiddleware.js";
import Post  from "../models/Post.js";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { getFeedPosts } from "../controllers/postController.js";

const router = express.Router();
// 🗂️ File upload config
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/posts"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadPost = multer({ storage: postStorage });

// Get feed posts (excluding logged-in user’s own posts)
router.get("/feed", auth, getFeedPosts);


// Create post with media
router.post("/", auth, uploadPost.array("media", 5), async (req, res) => {
  try {
    const { title, content } = req.body;

    const mediaFiles = req.files?.map(f => {
      const ext = path.extname(f.originalname).toLowerCase();
      const type = [".mp4", ".mov", ".avi"].includes(ext) ? "video" : "image";
      return { url: `/uploads/posts/${f.filename}`, type };
    }) || [];

    const post = new Post({ user: req.user.id, title, content, media: mediaFiles, likes: [] });
    await post.save();
    await post.populate("user", "name avatarUrl");

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update own post (atomic update to avoid full-document validation issues)
router.put("/:id", auth, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.title !== 'undefined') updates.title = req.body.title;
    if (typeof req.body.content !== 'undefined') updates.content = req.body.content;

    // find and update only if owner
    const post = await Post.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: updates }, { new: true })
      .populate("user", "name avatarUrl")
      .populate("comments.user", "name avatarUrl");

    if (!post) {
      // determine whether it was not found or forbidden
      const exists = await Post.exists({ _id: req.params.id });
      return exists ? res.status(403).json({ message: 'Forbidden' }) : res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Post update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete own post
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    await post.remove();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
// Add comment (FIXED)
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      content: req.body.content,
      user: req.user._id,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate just created comment
    const updated = await Post.findById(post._id)
      .populate("comments.user", "name avatarUrl");

    const addedComment = updated.comments[updated.comments.length - 1];

    res.json(addedComment);
  } catch (err) {
    console.error("Comment Create Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// Update own comment (atomic update)
router.put("/:postId/comment/:commentId", auth, async (req, res) => {
  try {
    // Update the specific comment content only if the comment user matches the authenticated user
    const result = await Post.findOneAndUpdate(
      { _id: req.params.postId, "comments._id": req.params.commentId, "comments.user": req.user.id },
      { $set: { "comments.$.content": req.body.content } },
      { new: true }
    ).populate("comments.user", "name avatarUrl");

    if (!result) {
      // Check existence to return a clearer error
      const postExists = await Post.exists({ _id: req.params.postId });
      if (!postExists) return res.status(404).json({ message: 'Post not found' });
      const commentExists = await Post.findOne({ _id: req.params.postId, "comments._id": req.params.commentId });
      if (!commentExists) return res.status(404).json({ message: 'Comment not found' });
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Return the updated comment object from the post
    const updatedComment = result.comments.id(req.params.commentId);
    res.json(updatedComment);
  } catch (err) {
    console.error('Comment update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete own comment
router.delete("/:postId/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    comment.remove();
    await post.save();
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ❤️ Like / Unlike post
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const index = post.likes.indexOf(userId);

    if (index === -1) post.likes.push(userId);
    else post.likes.splice(index, 1);

    await post.save();

    res.json({ likes: post.likes.length, liked: index === -1 });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🔗 Share post
router.post("/:id/share", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ message: "Post shared successfully!" });
  } catch (err) {
    console.error("Error sharing post:", err);
    res.status(500).json({ message: err.message });
  }
});

// 👤 Get posts by a specific user
router.get("/user/:id", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate("user", "name avatarUrl")
      .populate("comments.user", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;