# 🚀 DevConnect — AI Powered Developer Networking & Career Assistant

DevConnect is a **full-stack developer networking platform** that combines **professional networking, real-time messaging, and AI-powered career guidance** into one ecosystem.

The platform integrates ideas from:

* **LinkedIn** → Professional developer networking
* **WhatsApp / Discord** → Real-time chat & collaboration
* **AI Assistants** → Resume analysis & career coaching

It helps developers **connect, collaborate, and improve their career prospects using AI insights.**

---

# 🌐 Live Demo

🔗 https://dev-connect-bfw9koi2s-deshmukhshrutika59s-projects.vercel.app

---

# ✨ Key Features

## 🤖 AI Career Tools

* AI Career Coach for resume and GitHub guidance
* ATS-style Resume Analyzer
* Resume parsing using PyMuPDF
* AI suggestions for skill improvement
* Streaming AI responses
* Chat history saved for each user

---

## 🌐 Developer Social Network

* Developer profiles with skills and bio
* Create and share posts
* Like, comment, and interact with posts
* Follow and connect with other developers
* Smart developer search based on skills

---

## 💬 Real-Time Communication

* 1-to-1 chat
* Group chat support
* Typing indicators
* Seen message status
* Message editing
* File and media sharing

Built using **Socket.io for real-time communication.**

---

## 📊 Analytics Dashboard

* Profile growth tracking
* Post engagement analytics
* Developer activity insights
* GitHub integration

---

# 🧠 AI Architecture

DevConnect integrates an **AI microservice built using FastAPI**.

Capabilities include:

* Resume parsing
* ATS-style resume evaluation
* GitHub profile analysis
* Personalized career advice using **Google Gemini 1.5 Flash**

---

# 🏗️ System Architecture

Frontend communicates with backend APIs and AI microservices.

Frontend (React + Vite)
⬇
Node.js Backend (Express API)
⬇
MongoDB Database
⬇
FastAPI AI Microservice
⬇
Google Gemini 1.5 Flash

---

# 🛠️ Tech Stack

## Frontend

* React (Vite)
* TailwindCSS
* Framer Motion
* Context API
* socket.io-client

## Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* Socket.io

## AI Microservice

* Python
* FastAPI
* Google Gemini 1.5 Flash
* PyMuPDF (PDF parsing)

---

# 📂 Project Structure

```
DevConnect
│
├── backend/              # Node.js Express API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── resume-analyzer/      # FastAPI AI microservice
│   ├── main.py
│   ├── job_matcher.py
│   └── requirements.txt
│
└── frontend/             # React application
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── contexts/
    │   └── services/
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/deshmukhshrutika59/DevConnect.git
cd DevConnect
```

---

# 2️⃣ Backend Setup

```
cd backend
npm install
```

Create `.env` file inside `/backend`

```
PORT=5000
MONGO_URI=<your_mongo_url>
JWT_SECRET=<your_secret>
```

Run backend server

```
npm start
```

---

# 3️⃣ AI Microservice Setup

```
cd ../resume-analyzer
pip install -r requirements.txt
```

Create `.env`

```
GEMINI_API_KEY=<your_google_api_key>
```

Run FastAPI server

```
uvicorn main:app --reload --port 8000
```

---

# 4️⃣ Frontend Setup

```
cd ../frontend
npm install
```

Create `.env`

```
VITE_BACKEND_URL=http://localhost:5000
```

Start frontend

```
npm run dev
```

---

# 📈 Use Cases

DevConnect helps developers:

* Build professional networks
* Collaborate with other developers
* Get AI-powered resume feedback
* Improve career opportunities
* Communicate and share ideas

---

---

# 👩‍💻 Author

**Shrutika Deshmukh**
---

# ⭐ Support

If you like this project, please **star the repository** to support development.
