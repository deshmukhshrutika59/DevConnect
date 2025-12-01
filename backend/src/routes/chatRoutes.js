// backend/src/routes/chatRoutes.js
import express from "express";
import mongoose from "mongoose";
import protect from "../middleware/authMiddleware.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const router = express.Router();
// helper to emit group updates to participants
async function emitGroupUpdated(app, convo) {
  const populated = await Conversation.findById(convo._id).populate("participants", "name avatarUrl");
  const payload = {
    groupId: convo._id.toString(),
    name: convo.name,
    participants: populated.participants
  };
  const io = app.get("io");
  populated.participants.forEach(p => {
    // emit to all sockets associated with that user
    io?.to(p._id.toString()).emit("group_updated", payload);
  });
}
// ✅ Create or get existing one-to-one conversation
router.post("/conversations", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "UserId required" });
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid user id" });
    if (String(userId) === String(req.user._id))
      return res.status(400).json({ message: "Cannot chat with yourself" });

    // ✅ Only check for 1-to-1 conversations (avoid groups)
    let existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("participants", "name avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      });

    if (existing) return res.status(200).json(existing);

    // ✅ Otherwise create new
    const newConv = await Conversation.create({
      participants: [req.user._id, userId],
      isGroup: false,
    });

    const fullConv = await Conversation.findById(newConv._id)
      .populate("participants", "name avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      });

    // ✅ Emit socket update to both participants
    const io = req.app.get("io");
    [req.user._id.toString(), userId.toString()].forEach((id) =>
      io?.to(id).emit("new_conversation", fullConv)
    );

    return res.status(201).json(fullConv);
  } catch (err) {
    console.error("create conversation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get all conversations for user
router.get("/conversations", protect, async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate("participants", "name avatarUrl")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "name avatarUrl" } });

    res.json(convs);
  } catch (err) {
    console.error("get conversations error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ message: "Invalid conversation id" });

    const msgs = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "name avatarUrl")
      .populate("recipient", "name avatarUrl");

    res.json(msgs);
  } catch (err) {
    console.error("get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// REST fallback to send message (if sockets not used)
router.post("/messages", protect, async (req, res) => {
  try {
    const { conversationId, text, recipientId } = req.body;
    if (!conversationId || !text) return res.status(400).json({ message: "conversationId and text required" });

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      recipient: recipientId,
      content: text,
      editableUntil: new Date(Date.now() + 5 * 60 * 1000)
    });

    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: new Date() });

    const populated = await Message.findById(message._id).populate("sender", "name avatarUrl");
    // If socket io attached to app, emit
    req.app.get("io")?.to(`conversation:${conversationId}`).emit("new_message", populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("send message (rest) error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Create group chat
router.post("/create-group", protect, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length < 2)
      return res.status(400).json({ message: "Group must include at least 3 members." });

    const allMembers = [...new Set([...members, req.user._id.toString()])];
    const group = await Conversation.create({
      name,
      isGroup: true,
      admin: req.user._id,
      participants: allMembers,
    });

    const populated = await Conversation.findById(group._id).populate("participants", "name avatarUrl");

    // emit new_conversation to each participant
    const io = req.app.get("io");
    populated.participants.forEach(p => {
      io?.to(p._id.toString()).emit("new_conversation", populated);
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Rename group
router.put("/rename-group/:id", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: "Group not found" });
    if (convo.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can rename group" });

    convo.name = req.body.name || convo.name;
    await convo.save();

    // emit group_updated
    await emitGroupUpdated(req.app, convo);

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Add member
router.put("/group/:id/add", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group chat" });

    if (convo.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can add members" });

    if (!convo.participants.includes(req.body.userId)) {
      convo.participants.push(req.body.userId);
      await convo.save();
    }

    await emitGroupUpdated(req.app, convo);
    res.json(await convo.populate("participants", "name avatarUrl"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Remove member
router.put("/group/:id/remove", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo.isGroup) return res.status(400).json({ message: "Not a group chat" });

    if (convo.admin.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only admin can remove members" });

    convo.participants = convo.participants.filter(
      (p) => p.toString() !== req.body.userId
    );
    await convo.save();

    await emitGroupUpdated(req.app, convo);
    res.json(await convo.populate("participants", "name avatarUrl"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;