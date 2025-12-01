import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// File upload config (avatars)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/avatars"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// GET current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update profile
router.put("/me", auth, upload.single("photo"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      name,
      bio,
      location,
      experienceLevel,
      githubUsername,
      techStack,
      skills,
      education,
      socialLinks
    } = req.body;

    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.location = location || user.location;
    user.experienceLevel = experienceLevel || user.experienceLevel;
    user.githubUsername = githubUsername || user.githubUsername;
    if (techStack) user.techStack = JSON.parse(techStack);
    if (skills) user.skills = JSON.parse(skills);
    if (education) user.education = education;
    if (socialLinks) user.socialLinks = JSON.parse(socialLinks);
    if (req.file) user.avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET posts by user
// ✅ Get all posts created by a specific user
router.get('/:id/posts', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.warn('[users] invalid user id for posts:', req.params.id);
      return res.status(400).json({ message: 'Invalid user id', id: req.params.id });
    }

    const posts = await Post.find({ user: req.params.id })
      .populate('user', 'name avatarUrl') // 👈 ensures post.user has name & avatar
      .populate('comments.user', 'name avatarUrl') // 👈 ensures comment authors are populated
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
});

// GET comments by user (populated)
router.get("/:id/comments", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.warn('[users] invalid user id for comments:', req.params.id);
      return res.status(400).json({ message: 'Invalid user id', id: req.params.id });
    }
    // Find posts that have comments from this user
    const posts = await Post.find({ "comments.user": req.params.id })
      .populate("comments.user", "name avatarUrl"); // populate comment authors

    let comments = [];

    posts.forEach(post => {
      post.comments.forEach(c => {
        if (c.user._id.toString() === req.params.id) {
          comments.push({
            _id: c._id,
            content: c.content,
            createdAt: c.createdAt,
            user: c.user,           // now includes name + avatarUrl
            postId: post._id,
            postTitle: post.title
          });
        }
      });
    });
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(comments);
  } catch (err) {
    console.error("Error fetching user comments:", err);
    res.status(500).json({ message: err.message });
  }
});

// Search users by name, email, or tech stack
// Search users
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // Case-insensitive search by name, email, or techStack
    const regex = new RegExp(q, "i");
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { techStack: regex }
      ]
    }).select("-passwordHash"); // exclude password
    res.json(users);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUserId = req.user && req.user.id;
    const suggestions = await User.find({ _id: { $ne: currentUserId } }).limit(5).select('-passwordHash');
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/:id/connect", auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUserId = req.user.id;

    if (targetUserId === loggedInUserId) {
      return res.status(400).json({ message: "You cannot connect with yourself" });
    }

    const userA = await User.findById(loggedInUserId);   // logged-in user
    const userB = await User.findById(targetUserId);     // target user

    if (!userA || !userB) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already connected?
    if (userA.connections.includes(targetUserId)) {
      return res.status(400).json({ message: "Already connected" });
    }

    // Add connections both ways
    userA.connections.push(targetUserId);
    userB.connections.push(loggedInUserId);

    await userA.save();
    await userB.save();

    // --------------------------
    // 🔔 Create Notification
    // --------------------------
    const notif = await createNotification({
      user: userB._id,             // receiver
      sender: userA._id,           // sender
      type: "follow",
      message: `${userA.name} connected with you`,
      link: `/profile/${userA._id}`,
    });

    // --------------------------
    // ⚡ Real-time Notification
    // --------------------------
    const io = req.app.get("io");
    sendRealtimeNotification(io, userB._id, notif);

    // --------------------------
    // 📊 Analytics Update
    // --------------------------
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    let analytics = await Analytics.findOne({ user: userB._id });
    if (!analytics) analytics = new Analytics({ user: userB._id });

    const todayConn = analytics.connectionEvents.find(
      (v) => new Date(v.date).toDateString() === startOfDay.toDateString()
    );

    if (todayConn) todayConn.count += 1;
    else analytics.connectionEvents.push({ date: startOfDay, count: 1 });

    await analytics.save();

    res.json({ message: "Connected successfully" });

  } catch (err) {
    console.error("Connect Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Disconnect (unfriend)
router.post("/:id/disconnect", auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUserId = req.user.id;

    const user = await User.findById(loggedInUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    user.connections = user.connections.filter(
      (connId) => connId.toString() !== targetUserId
    );
    targetUser.connections = targetUser.connections.filter(
      (connId) => connId.toString() !== loggedInUserId
    );

    await user.save();
    await targetUser.save();

    res.json({ message: "Disconnected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get all connections (people the user has connected with)
router.get("/me/connections", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("connections", "name avatarUrl bio experienceLevel")
      .select("connections");
    
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.connections || []);
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.warn('[users] invalid user id get profile:', req.params.id);
      return res.status(400).json({ message: 'Invalid user id', id: req.params.id });
    }

    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate({
        path: 'connections',
        select: 'name avatarUrl'
      });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;