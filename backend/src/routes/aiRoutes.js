// // routes/aiRoutes.js
import express from "express";
import multer from "multer";
import protect from "../middleware/authMiddleware.js";
import { chatWithAssistant } from "../controllers/aiController.js";

const router = express.Router();

// Configure Multer (Store in memory to forward to Python)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/ai/chat
// Accepts 'message' (text) and 'file' (attachment)
router.post("/chat", protect, upload.single('file'), chatWithAssistant);

export default router;