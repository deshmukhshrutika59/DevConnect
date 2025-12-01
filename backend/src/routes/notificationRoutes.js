import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
getNotificationsHandler,
getUnreadCountHandler,
markReadHandler,
markAllReadHandler,
deleteNotificationHandler,
} from "../controllers/notificationController.js";


const router = express.Router();


router.get("/", protect, getNotificationsHandler);
router.get("/unread-count", protect, getUnreadCountHandler);
router.put("/mark-read/:id", protect, markReadHandler);
router.put("/mark-all-read", protect, markAllReadHandler);
router.delete("/:id", protect, deleteNotificationHandler);


export default router;