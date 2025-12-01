// backend/src/routes/messages.js
import express from "express";
import protect from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";

const router = express.Router();

// GET messages for a conversation
router.get("/:conversationId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "name avatarUrl")
      .populate("recipient", "name avatarUrl")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// PATCH edit message (REST + broadcast)
router.patch("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, media } = req.body;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not allowed" });
    if (msg.editableUntil && Date.now() > new Date(msg.editableUntil).getTime()) return res.status(400).json({ error: "Edit window expired" });

    if (content !== undefined) msg.content = content;
    if (media !== undefined) msg.media = media;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await Message.findById(msg._id).populate("sender", "name avatarUrl");
    const io = req.app.get("io");
    io && io.to(`conversation:${msg.conversation}`).emit("message_edited", populated);

    res.json({ success: true, message: populated });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft) + broadcast
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) return res.status(403).json({ error: "Not allowed" });
    if (msg.editableUntil && Date.now() > new Date(msg.editableUntil).getTime()) return res.status(400).json({ error: "Delete window expired" });

    msg.content = "[deleted]";
    msg.media = undefined;
    msg.deletedAt = new Date();
    await msg.save();

    const io = req.app.get("io");
    io && io.to(`conversation:${msg.conversation}`).emit("message_deleted", { messageId: msg._id });

    res.json({ success: true, messageId: msg._id });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/share
router.post("/share", protect, async (req, res) => {
  try {
    const { postId, recipients = [], comment = "" } = req.body;
    if (!postId || !recipients.length) return res.status(400).json({ message: "postId and recipients are required" });

    const Post = require("../models/Post");
    const Conversation = require("../models/Conversation");
    const Message = require("../models/Message");

    const orig = await Post.findById(postId);
    if (!orig) return res.status(404).json({ message: "Post not found" });

    const createdMessages = [];
    for (const rid of recipients) {
      // find or create one-to-one conv
      let convo = await Conversation.findOne({ participants: { $all: [req.user._id, rid], $size: 2 } });
      if (!convo) {
        convo = await Conversation.create({ participants: [req.user._id, rid] });
      }

      const msg = await Message.create({
        conversation: convo._id,
        sender: req.user._id,
        recipient: rid,
        content: "",
        sharedPost: {
          postId: orig._id,
          text: orig.text || "",
          image: orig.image || null,
          video: orig.video || null,
          originalAuthorName: orig.authorName || ""
        },
        comment,
        seenBy: [req.user._id],
      });

      convo.lastMessage = msg._id;
      convo.updatedAt = new Date();
      await convo.save();

      createdMessages.push(await Message.findById(msg._id).populate("sender", "name avatarUrl"));
      // notify via socket (if server has io)
      const io = req.app.get("io");
      if (io) {
        io.to(`conversation:${convo._id}`).emit("new_message", createdMessages[createdMessages.length - 1]);
        // update conversation preview for participants
        convo.participants.forEach(pid => {
          const sockets = onlineUsers.get(pid.toString());
          if (sockets) sockets.forEach(sid => io.to(sid).emit("conversation_updated", { conversationId: convo._id, lastMessage: createdMessages[createdMessages.length - 1] }));
        });
      }
    }

    return res.status(201).json({ success: true, messages: createdMessages });
  } catch (err) {
    console.error("share REST err:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


export default router;
