// backend/controllers/chatController.js
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { createNotification } from "../services/notificationService.js";
import { sendRealtimeNotification } from "../utils/socketNotifications.js";
/**
 * Helper to normalize id values.
 */
const toId = (v) => {
  try {
    if (!v) return null;
    return mongoose.Types.ObjectId(v);
  } catch (e) {
    return null;
  }
};

// Try to extract user id from Authorization header if req.user is not present
const idFromAuthHeader = (req) => {
  try {
    const hdr = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!hdr) return null;
    const raw = hdr.startsWith("Bearer ") ? hdr.split(" ")[1] : hdr;
    const payload = jwt.verify(raw, process.env.JWT_SECRET);
    return payload && (payload.id || payload._id || payload.userId) ? (payload.id || payload._id || payload.userId) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Create or return existing one-to-one conversation between two users.
 * Body may be:
 *  - { senderId, receiverId }
 *  - { userId }  (when the caller is authenticated; other user id in 'userId')
 * If using auth middleware, prefer req.user.id as sender.
 */
export const createConversation = async (req, res) => {
  try {
    // allow senderId from body OR from authenticated req.user OR Authorization header
    const senderId = req.body.senderId || (req.user && (req.user.id || req.user._id)) || idFromAuthHeader(req) || null;
    const receiverId = req.body.receiverId || req.body.userId || req.body.user_id || null;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId are required" });
    }

    const sId = toId(senderId);
    const rId = toId(receiverId);
    if (!sId || !rId) return res.status(400).json({ message: "Invalid user ids" });

    // Find existing one-to-one conversation (exactly these two participants)
    let conversation = await Conversation.findOne({
      participants: { $all: [sId, rId], $size: 2 },
    })
      .populate("participants", "name avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      });

    if (!conversation) {
      conversation = new Conversation({ participants: [sId, rId] });
      await conversation.save();
      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "name avatarUrl");
    }

    return res.status(200).json(conversation);
  } catch (err) {
    console.error("createConversation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all conversations for a user id param OR the authenticated user if not provided.
 * Query /api/conversations?userId=<id> or /api/conversations (with auth)
 */
export const getUserConversations = async (req, res) => {
  try {
  const userId = req.query.userId || (req.user && (req.user.id || req.user._id)) || idFromAuthHeader(req);
  if (!userId) return res.status(400).json({ message: "userId required" });
    const uId = toId(userId);
    if (!uId) return res.status(400).json({ message: "Invalid userId" });

    const conversations = await Conversation.find({ participants: uId })
      .sort({ updatedAt: -1 })
      .populate("participants", "name avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      });

    return res.status(200).json(conversations);
  } catch (err) {
    console.error("getUserConversations error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



export const startConversation = async (req, res) => {
  const { recipientId } = req.body;
  const userId = req.user._id;

  if (!recipientId) return res.status(400).json({ message: "Recipient required" });

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, recipientId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
    });
  }

  res.json(conversation);
};
/**
 * Get messages for a conversation id param
 * GET /api/conversations/:conversationId/messages
 */
export const getConversationMessages = async (req, res) => {
  try {
  const conversationId = req.params.conversationId || req.query.conversationId;
  if (!conversationId) return res.status(400).json({ message: "conversationId required" });
    const cId = toId(conversationId);
    if (!cId) return res.status(400).json({ message: "Invalid conversationId" });

    const messages = await Message.find({ conversation: cId })
      .sort({ createdAt: 1 })
      .populate("sender", "name avatarUrl")
      .populate("recipient", "name avatarUrl");

    return res.status(200).json(messages);
  } catch (err) {
    console.error("getConversationMessages error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Send a message (persist it).
 * Body: { conversationId, text } - sender from req.user preferably
 * If conversationId is not provided, you may optionally pass recipientId to create/find conversation.
 */
export const sendMessage = async (req, res) => {
  try {
  const senderId = req.body.senderId || (req.user && (req.user.id || req.user._id)) || idFromAuthHeader(req);
    let conversationId = req.body.conversationId || null;
    const text = req.body.text || req.body.content || "";
    const recipientId = req.body.recipientId || req.body.receiverId || req.body.userId || null;

    if (!senderId) return res.status(400).json({ message: "senderId required (or authenticate user)" });

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    } else if (recipientId) {
      // find or create one-to-one conversation
      const sId = toId(senderId);
      const rId = toId(recipientId);
      if (!sId || !rId) return res.status(400).json({ message: "Invalid ids" });

      conversation = await Conversation.findOne({ participants: { $all: [sId, rId], $size: 2 } });
      if (!conversation) {
        conversation = new Conversation({ participants: [sId, rId] });
        await conversation.save();
      }
    } else {
      return res.status(400).json({ message: "conversationId or recipientId required" });
    }

    const message = new Message({
      conversation: conversation._id,
      sender: toId(senderId),
      recipient: recipientId ? toId(recipientId) : conversation.participants.find(p => p.toString() !== senderId.toString()),
      content: text,
      editableUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    await message.save();

    // update conversation lastMessage & updatedAt
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // populate before returning
    const populated = await Message.findById(message._id).populate("sender", "name avatarUrl").populate("recipient", "name avatarUrl");

    // Optionally: emit via socket (if you have access to io from request/app)
    // e.g. req.app.get('io')?.to(`conversation:${conversation._id}`).emit('new_message', populated);

    return res.status(201).json(populated);
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Edit message (allowed if sender and within editable window)
 */
export const editMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const newText = req.body.text || req.body.content;
    if (!messageId) return res.status(400).json({ message: "messageId required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const requesterId = req.user && (req.user.id || req.user._id);
    if (!requesterId || message.sender.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: "Not allowed to edit this message" });
    }

    if (message.editableUntil && Date.now() > new Date(message.editableUntil).getTime()) {
      return res.status(403).json({ message: "Edit window expired" });
    }

    message.content = newText;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(message._id).populate("sender", "name avatarUrl");

    // Optionally emit via socket...
    return res.status(200).json(populated);
  } catch (err) {
    console.error("editMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Soft-delete message (mark content as "[deleted]" to keep conversation flow).
 */
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    if (!messageId) return res.status(400).json({ message: "messageId required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const requesterId = req.user && (req.user.id || req.user._id);
    if (!requesterId || message.sender.toString() !== requesterId.toString()) {
      return res.status(403).json({ message: "Not allowed to delete this message" });
    }

    if (message.editableUntil && Date.now() > new Date(message.editableUntil).getTime()) {
      return res.status(403).json({ message: "Delete window expired" });
    }

    message.content = "[deleted]";
    message.deletedAt = new Date();
    await message.save();

    // Optionally emit via socket...
    return res.status(200).json({ success: true, messageId: message._id });
  } catch (err) {
    console.error("deleteMessage error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// Notify recipient if not the sender
const recipientId = message.recipient && message.recipient._id ? message.recipient._id : message.recipient;
if (recipientId && recipientId.toString() !== (req.user._id || req.user.id).toString()) {
const notif = await createNotification({
user: recipientId,
sender: req.user._id,
type: "message",
message: `${req.user.name} sent you a message`,
link: `/messages/${conversation._id}`,
});
const io = req.app.get("io");
sendRealtimeNotification(io, recipientId, notif);
} 