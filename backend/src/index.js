// backend/src/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploads.js";
import messageRoutes from "./routes/messages.js";
import searchRoutes from "./routes/searchRoutes.js";
import connectDB from "./config/db.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import Post from "./models/Post.js";
import recommendRoutes from "./routes/recommendRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";


import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ["http://localhost:3000"];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowedOrigins explicitly, OR is a vercel preview deployment, OR is localhost
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/analytics", analyticsRouter);
// app.use("/api/analyzer", resumeAnalyzerRoutes);
// app.use("/api/github", githubRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);




app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});
app.set("io", io);

const onlineUsers = new Map();

// verify socket token function
const verifySocketToken = (token) => {
  try {
    if (!token) return null;
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    return jwt.verify(raw, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// add token auth middleware to socket handshake
io.use((socket, next) => {
  const token = (socket.handshake.auth && socket.handshake.auth.token) || "";
  const payload = verifySocketToken(token);
  if (!payload) return next(new Error("Unauthorized"));
  socket.user = payload;
  next();
});

// helper: update conversation's lastMessage & emit conversation_updated to participants' sockets
async function updateConversationAndEmit(io, conversationId, lastMessageDoc, onlineUsers) {
  try {
    const convo = await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: lastMessageDoc._id || lastMessageDoc, updatedAt: new Date() },
      { new: true }
    ).populate("participants", "name avatarUrl");

    if (!convo) return;

    // Emit conversation_updated to each participant's sockets
    convo.participants.forEach((p) => {
      const sockets = onlineUsers.get(p._id.toString());
      if (sockets) {
        sockets.forEach((sid) => {
          io.to(sid).emit("conversation_updated", {
            conversationId: convo._id,
            lastMessage: lastMessageDoc,
          });
        });
      }
    });
  } catch (err) {
    console.error("updateConversationAndEmit error:", err);
  }
}

io.on("connection", (socket) => {
  const userId = socket.user && (socket.user._id || socket.user.id || socket.user.userId);
  console.log(`✅ Socket connected: ${socket.id} for user ${userId}`);

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // add socket id to user's set
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  io.emit("user_online", { userId });
  console.log(`✅ Socket connected: ${socket.id} for user ${userId}`);

  // join conversation room (room name: conversation:ID)
  socket.on("join_conversation", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave_conversation", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  // typing indicators
  socket.on("typing", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("typing", { userId });
  });

  socket.on("stop_typing", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation:${conversationId}`).emit("stop_typing", { userId });
  });

  // --- NOTIFICATION: join personal room ---
  socket.join(`user:${userId}`);
  console.log(`🔔 Joined notification room user:${userId}`);

  // listen for client marking notifications read etc if you want
  socket.on('notification:mark_read', ({ id }) => { /* optional */ });

  // SEND MESSAGE (text or media)
  socket.on("send_message", async (data, callback) => {
    try {
      const { conversationId, recipientId, content, media } = data;
      if (!userId) throw new Error("Unauthorized");
      if (!conversationId) throw new Error("Missing conversationId");

      // Base message
      const msgPayload = {
        conversation: conversationId,
        sender: userId,
        recipient: recipientId || null,
        content: content || "",
        type: "text",
      };

      // If media (upload returned object with url/mimeType/filename/size)
      if (media && media.url) {
        msgPayload.type = "media";
        msgPayload.media = {
          url: media.url,
          mimeType: media.mimeType || "",
          filename: media.filename || "",
          size: media.size || 0,
        };
      }

      const newMessage = await Message.create(msgPayload);

      // populate sender for frontend
      const populated = await Message.findById(newMessage._id).populate("sender", "name avatarUrl").lean();

      // emit to conversation room
      io.to(`conversation:${conversationId}`).emit("new_message", populated);

      // update conversation lastMessage and emit sidebar update
      await updateConversationAndEmit(io, conversationId, populated, onlineUsers);

      callback?.({ success: true, message: populated });
    } catch (err) {
      console.error("❌ send_message error:", err);
      callback?.({ success: false, error: err.message });
    }
  });

  // FORWARD MESSAGE (copy message into another conversation)
  socket.on("forward_message", async ({ messageId, toConversationId }, callback) => {
    try {
      if (!userId) throw new Error("Unauthorized");
      if (!messageId || !toConversationId) throw new Error("Missing params");

      const original = await Message.findById(messageId).lean();
      if (!original) throw new Error("Original message not found");

      // build new message payload — include media or sharedPost if present
      const newPayload = {
        conversation: toConversationId,
        sender: userId,
        recipient: null,
        content: original.content || "",
        type: original.type || "text",
      };

      if (original.media && original.media.url) {
        newPayload.type = "media";
        newPayload.media = original.media;
      }

      if (original.sharedPost) {
        newPayload.type = "shared_post";
        newPayload.sharedPost = original.sharedPost;
      }

      const newMessage = await Message.create(newPayload);
      const populated = await Message.findById(newMessage._id).populate("sender", "name avatarUrl").lean();

      io.to(`conversation:${toConversationId}`).emit("new_message", populated);
      await updateConversationAndEmit(io, toConversationId, populated, onlineUsers);

      callback?.({ success: true, message: populated });
    } catch (err) {
      console.error("❌ forward_message error:", err);
      callback?.({ success: false, error: err.message });
    }
  });

  // SHARE POST (share post object as a message)
  socket.on("share_post", async ({ postId, toConversationId }, callback) => {
    try {
      if (!userId) throw new Error("Unauthorized");
      if (!postId || !toConversationId) throw new Error("Missing postId or toConversationId");

      const post = await Post.findById(postId).populate("user", "name avatarUrl").lean();
      if (!post) throw new Error("Post not found");

      // normalize media array (strings or objects)
      const safeMedia = Array.isArray(post.media)
        ? post.media.map((m) => (typeof m === "string" ? m : m?.url || m?.path || ""))
        : [];

      const newMessage = await Message.create({
        conversation: toConversationId,
        sender: userId,
        type: "shared_post",
        sharedPost: {
          postId: post._id.toString(),
          title: post.title || "",
          content: post.content || "",
          media: safeMedia,
          originalAuthorId: post.user?._id ? post.user._id.toString() : null,
          originalAuthorName: post.user?.name || "Unknown",
        },
      });

      const populated = await Message.findById(newMessage._id).populate("sender", "name avatarUrl").lean();

      io.to(`conversation:${toConversationId}`).emit("new_message", populated);
      await updateConversationAndEmit(io, toConversationId, populated, onlineUsers);

      callback?.({ success: true, message: populated });
    } catch (err) {
      console.error("❌ share_post error:", err);
      callback?.({ success: false, error: err.message });
    }
  });

  // DELETE message
  socket.on("delete_message", async ({ messageId }, ack) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return ack?.({ success: false, error: "Message not found" });

      if (msg.sender.toString() !== userId.toString())
        return ack?.({ success: false, error: "Not allowed" });

      await Message.findByIdAndDelete(messageId);
      io.to(`conversation:${msg.conversation}`).emit("message_deleted", { messageId });
      ack?.({ success: true });
    } catch (err) {
      console.error("delete_message error:", err);
      ack?.({ success: false, error: err.message });
    }
  });

  // EDIT message
  socket.on("edit_message", async ({ messageId, content }, ack) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return ack?.({ success: false, error: "Message not found" });

      if (msg.sender.toString() !== userId.toString())
        return ack?.({ success: false, error: "Not allowed" });

      msg.content = content;
      msg.editedAt = new Date();
      await msg.save();

      const populated = await Message.findById(msg._id).populate("sender", "name avatarUrl").lean();
      io.to(`conversation:${msg.conversation}`).emit("message_edited", populated);
      ack?.({ success: true, message: populated });
    } catch (err) {
      console.error("edit_message error:", err);
      ack?.({ success: false, error: err.message });
    }
  });

  // MARK SEEN
  socket.on("mark_seen", async ({ conversationId }) => {
    try {
      await Message.updateMany(
        { conversation: conversationId, seenBy: { $ne: userId } },
        { $addToSet: { seenBy: userId } }
      );
      io.to(`conversation:${conversationId}`).emit("messages_seen", {
        conversationId,
        seenBy: userId,
      });
    } catch (err) {
      console.error("mark_seen error:", err);
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user_offline", { userId });
      }
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
