import express from "express";
import protect from "../middleware/authMiddleware.js";
import { recommendUsers ,recommendedPosts } from "../controllers/recommendController.js";

const router = express.Router();

router.get("/users", protect, recommendUsers);
router.get("/posts", protect, recommendedPosts);


export default router;
