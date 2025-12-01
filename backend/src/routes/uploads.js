// backend/src/routes/uploads.js
import express from "express";
import upload from "../middleware/upload.js";
import protect from "../middleware/authMiddleware.js"; // your existing auth middleware


const router = express.Router();
router.post("/message-file", protect, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const file = req.file;
    // Return absolute URL so frontend can use it directly
    const fullUrl = `${req.protocol}://${req.get("host")}/uploads/messages/${file.filename}`;
    res.json({
      url: fullUrl,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    });
  } catch (err) {
    console.error("upload err", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
