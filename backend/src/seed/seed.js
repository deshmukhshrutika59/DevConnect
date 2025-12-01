// backend/src/seed/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from  "@faker-js/faker";
import User  from "../models/User";
import Post from "../models/Post";
import Conversation from "../models/Conversation";
import Message from "../models/Message";

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

  // 1️⃣ Create Users
  const users = [];
  for (let i = 0; i < 6; i++) {
    const user = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: "hashed-password", // not used for login
      bio: faker.lorem.sentence(),
      githubUsername: faker.internet.username(),
      techStack: faker.helpers.arrayElements(
        ["React", "Node.js", "MongoDB", "Python", "TensorFlow"],
        3
      ),
      avatarUrl: `https://i.pravatar.cc/150?img=${i + 10}`,
    });
    users.push(user);
  }
  console.log(`👥 Created ${users.length} users`);

  // 2️⃣ Create Posts
  const posts = [];
  for (const user of users) {
    for (let j = 0; j < 2; j++) {
      const post = await Post.create({
        user: user._id,
        title: faker.lorem.words(4),
        content: faker.lorem.paragraph(),
        media: [],
        likes: faker.helpers.arrayElements(users.map((u) => u._id), 2),
        comments: [
          {
            user: faker.helpers.arrayElement(users)._id,
            content: faker.lorem.sentence(), // ✅ fixed field name
            createdAt: new Date(),
          },
        ],
      });
      posts.push(post);
    }
  }
  console.log(`📝 Created ${posts.length} posts`);

  // 3️⃣ Create Conversations (1–1 + 1 group)
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
      content: "Hey! How's the project going?",
    },
    {
      conversation: convo1._id,
      sender: users[1]._id,
      content: "All good! Working on backend routes now.",
    },
    {
      conversation: convo2._id,
      sender: users[2]._id,
      content: "Frontend deployed successfully 🚀",
    },
    {
      conversation: convo2._id,
      sender: users[3]._id,
      content: "Nice work!",
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

  console.log("✅ Database seeding complete!");
  mongoose.connection.close();
}

main().catch((err) => console.error("❌ Seed error:", err));
