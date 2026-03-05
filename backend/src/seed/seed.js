// backend/src/seed/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import { faker } from "@faker-js/faker";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/devconnect";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  await Promise.all([
    User.deleteMany(),
    Post.deleteMany(),
    Conversation.deleteMany(),
    Message.deleteMany(),
  ]);
  console.log("🧹 Cleared old data");

  // Read static JSON data
  const dataPath = new URL('./data.json', import.meta.url);
  const rawData = fs.readFileSync(dataPath);
  const data = JSON.parse(rawData);

  // 1️⃣ Create Users
  const users = [];
  for (const userData of data.users) {
    const user = await User.create(userData);
    users.push(user);
  }
  console.log(`👥 Created ${users.length} users`);

  // 2️⃣ Create Posts
  const posts = [];
  for (const postData of data.posts) {
    const authorUser = users[postData.authorIndex];
    if (!authorUser) continue;

    const postComments = postData.comments.map(c => ({
      user: users[c.authorIndex]._id,
      content: c.content,
      createdAt: new Date(),
    }));

    const post = await Post.create({
      user: authorUser._id,
      title: postData.title,
      content: postData.content,
      media: postData.media || [],
      likes: [],
      comments: postComments,
    });
    posts.push(post);
  }
  console.log(`📝 Created ${posts.length} posts`);

  // 3️⃣ Create Conversations (Between the first 4 users if available)
  if (users.length >= 4) {
    const convo1 = await Conversation.create({
      participants: [users[0]._id, users[1]._id],
    });
    const convo2 = await Conversation.create({
      participants: [users[2]._id, users[3]._id],
    });
    const groupConvo = await Conversation.create({
      participants: [users[0]._id, users[1]._id, users[2]._id, users[3]._id],
      groupName: "Project Collab Squad",
    });
    console.log("💬 Created 3 conversations");

    // 4️⃣ Create Messages
    const sampleMessages = [
      {
        conversation: convo1._id,
        sender: users[0]._id,
        content: "Hey! How's the new microservices architecture going?",
      },
      {
        conversation: convo1._id,
        sender: users[1]._id,
        content: "All good! We're testing the Fastify routes now.",
      },
      {
        conversation: convo2._id,
        sender: users[2]._id,
        content: "The new UI is finally responsive on mobile 🚀",
      },
      {
        conversation: convo2._id,
        sender: users[3]._id,
        content: "Nice work! Looks awesome.",
      },
      {
        conversation: groupConvo._id,
        sender: users[0]._id,
        type: "shared_post",
        sharedPost: {
          postId: posts[0]._id,
          originalAuthorId: posts[0].user,
          originalAuthorName: users[0].name,
          title: posts[0].title,
          content: posts[0].content,
        },
      },
    ];

    await Message.insertMany(sampleMessages);
    console.log("💭 Inserted messages");
  }

  console.log("✅ Database seeding complete!");
  mongoose.connection.close();
}

main().catch((err) => console.error("❌ Seed error:", err));
