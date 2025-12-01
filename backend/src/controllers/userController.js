import User from "../models/User.js";
import Analytics from "../models/Analytics.js";
import { createNotification } from "../services/notificationService.js";
import { sendRealtimeNotification } from "../utils/socketNotifications.js";

// ===============================
// GET CURRENT LOGGED-IN USER
// ===============================
export const getCurrentUser = async (req, res) => {
  res.json(req.user);
};

// ===============================
// UPDATE USER PROFILE
// ===============================
export const updateUser = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id)
      return res.status(403).json({ message: "Forbidden" });

    const updates = { ...req.body };
    delete updates.passwordHash; // security safety

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-passwordHash");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// GET USER PROFILE + COUNT PROFILE VIEWS
// ===============================
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const viewerId = req.user?._id?.toString();

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Record profile view (only if viewer isn't the same user)
    if (viewerId && viewerId !== userId) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));

      let analytics = await Analytics.findOne({ user: userId });
      if (!analytics) analytics = new Analytics({ user: userId, profileViews: [] });

      const todayView = analytics.profileViews.find(
        (v) => new Date(v.date).toDateString() === startOfDay.toDateString()
      );

      if (todayView) todayView.count += 1;
      else analytics.profileViews.push({ date: startOfDay, count: 1 });

      await analytics.save();
    }

    res.json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// FOLLOW USER + NOTIFICATIONS + ANALYTICS
// ===============================
export const followUser = async (req, res) => {
  try {
    const userA = req.user; // follower
    const userBId = req.params.id; // target user being followed

    if (userA._id.toString() === userBId)
      return res.status(400).json({ message: "Cannot follow yourself" });

    const userB = await User.findById(userBId);
    if (!userB) return res.status(404).json({ message: "User not found" });

    // Add follower
    if (!userB.followers.includes(userA._id)) {
      userB.followers.push(userA._id);
      await userB.save();
    }

    // Add connection in A's list
    if (!userA.connections.includes(userBId)) {
      userA.connections.push(userBId);
      await userA.save();
    }

    // ==============================
    // CREATE NOTIFICATION
    // ==============================
    if (userB._id.toString() !== userA._id.toString()) {
      const notif = await createNotification({
        user: userB._id,          // receiver
        sender: userA._id,        // follower
        type: "follow",
        message: `${userA.name} started following you`,
        link: `/profile/${userA._id}`,
      });

      const io = req.app.get("io");
      sendRealtimeNotification(io, userB._id, notif);
    }

    // ==============================
    // ANALYTICS COUNT
    // ==============================
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    let analytics = await Analytics.findOne({ user: userBId });
    if (!analytics) analytics = new Analytics({ user: userBId });

    const todayConn = analytics.connectionEvents.find(
      (v) => new Date(v.date).toDateString() === startOfDay.toDateString()
    );

    if (todayConn) todayConn.count += 1;
    else analytics.connectionEvents.push({ date: startOfDay, count: 1 });

    await analytics.save();

    res.json({ success: true, message: "Followed successfully" });
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
