# 🚀 DevConnect — AI Powered Developer Networking & Career Assistant

DevConnect is a full-stack **MERN + FastAPI + Gemini** platform built for developers to network, collaborate, grow professionally, and get personalized AI career guidance.

It combines features of:
- **LinkedIn** (professional network)
- **WhatsApp** (real-time chat)
- **ChatGPT** (AI Assistant & Resume Analyzer)

## ✨ Features

### 🤖 AI Career Tools 
- AI Career Coach: Smart assistant for resume + GitHub analysis
- Resume Analyzer: ATS-style evaluation
- Streaming AI responses
- Chat history stored for each user

### 🌐 Social Networking
- Developer feed & posts
- Likes, comments, shares
- Connections & following
- Smart search for developers by skills

### 💬 Real-Time Communication
- 1-to-1 chat & group chat using Socket.io
- Seen status, live typing, message edits
- File and media support

### 📊 Analytics & Insights
- Analytics dashboard
- Profile growth
- Post & engagement statistics
- GitHub integration

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)
- TailwindCSS
- Framer Motion
- Context API
- socket.io-client

### **Backend**
- Node.js + Express
- MongoDB (Mongoose)
- JWT Authentication
- Socket.io

### **AI Service**
- Python + FastAPI
- Google Gemini 1.5 Flash
- PyMuPDF (PDF parsing)

## 📂 Project Structure

```
root/
├── backend/            # Express API (Auth, Posts, Chat, Users)
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── server.js
│
├── resume-analyzer/    # Python FastAPI Microservice
│   ├── main.py
│   ├── job_matcher.py
│   └── requirements.txt
│
└── frontend/           # React UI
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── contexts/
    └── package.json
```

# 🔧 Setup & Installation

## 1️⃣ Clone the Repository
```bash
git clone https://github.com/deshmukhshrutika59/DevConnect.git
cd devconnect
```

## 2️⃣ Setup Backend (Node.js)
```bash
cd backend
npm install
```

Create `.env` in `/backend`:

```
PORT=5000
MONGO_URI=<your_mongo_url>
JWT_SECRET=<your_secret>
```

Start backend:
```bash
npm start
```

## 3️⃣ Setup AI Microservice (Python FastAPI)
```bash
cd ../resume-analyzer
pip install -r requirements.txt
```

Create `.env`:

```
GEMINI_API_KEY=<your_google_api_key>
```

Run FastAPI:
```bash
uvicorn main:app --reload --port 8000
```

## 4️⃣ Setup Frontend (React + Vite)
```bash
cd ../frontend
npm install
```

Create `.env`:

```
VITE_BACKEND_URL=http://localhost:5000
```

Start UI:
```bash
npm run dev
```

# 🧠 API Endpoints

## 📌 Node Backend

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/posts/feed | User feed |
| POST | /api/ai/chat | Chat with AI |

## 📌 Python Resume AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analyze-resume | Analyze PDF/DOCX |
| POST | /match-job-title | Evaluate against job title |

# 🧪 How to Test
- Sign up
- Upload resume
- Chat with AI assistant
- Send messages
- Create posts

# 🤝 Contributing
Fork → Create branch → Commit → PR

# 📃 License
MIT License

<p align="center">
Built with ❤️ for Developers
</p>
