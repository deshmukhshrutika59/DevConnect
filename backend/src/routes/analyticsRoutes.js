import express from "express";
import { getUserAnalytics, generateInsights } from "../controllers/analyticsController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserAnalytics);
router.get("/insights", protect, generateInsights);

export default router;
