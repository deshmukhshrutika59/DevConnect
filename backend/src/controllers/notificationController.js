import User from "../models/User.js";
import {
  getNotificationsForUser,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService.js";


// ----------------- GET NOTIFICATIONS -----------------
export const getNotificationsHandler = async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user._id);

    return res.json({
      success: true,
      notifications
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ----------------- UNREAD COUNT -----------------
export const getUnreadCountHandler = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    return res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};


// ----------------- MARK ONE READ -----------------
export const markReadHandler = async (req, res) => {
  try {
    const updated = await markNotificationRead(req.params.id, req.user._id);
    return res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ message: "Could not mark as read" });
  }
};


// ----------------- MARK ALL READ -----------------
export const markAllReadHandler = async (req, res) => {
  try {
    await markAllNotificationsRead(req.user._id);
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all read" });
  }
};


// ----------------- DELETE NOTIFICATION -----------------
export const deleteNotificationHandler = async (req, res) => {
  try {
    await deleteNotification(req.params.id, req.user._id);
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
