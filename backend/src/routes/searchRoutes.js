// src/routes/searchRoutes.js
import express from "express";
import  protect  from "../middleware/authMiddleware.js";
import { semanticSearch } from "../controllers/searchController.js";

const router = express.Router();

router.post("/semantic", protect, semanticSearch);

export default router;
