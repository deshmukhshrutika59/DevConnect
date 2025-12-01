// backend/src/services/notificationService.js
import Notification from "../models/Notification.js";

/**
 * Fetch notifications with pagination + filter
 * @param {String} userId
 * @param {Object} options - { page, limit, type }
 */
export const getNotificationsForUser = async (userId, options = {}) => {
  const page = Math.max(1, parseInt(options.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(options.limit || 20, 10)));
  const skip = (page - 1) * limit;
  const filter = { user: userId };
  if (options.type && Array.isArray(options.type) && options.type.length) {
    filter.type = { $in: options.type };
  } else if (options.type && typeof options.type === "string") {
    filter.type = options.type;
  }

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name username avatar"),
  ]);

  return {
    notifications,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user: userId, read: false });
};

export const createNotification = async ({ user, sender, type, message, link }) => {
  return await Notification.create({ user, sender, type, message, link });
};

export const markNotificationRead = async (notifId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notifId, user: userId },
    { read: true },
    { new: true }
  );
};

export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
};

export const deleteNotification = async (notifId, userId) => {
  await Notification.findOneAndDelete({ _id: notifId, user: userId });
};
