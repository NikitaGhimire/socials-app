const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getNotifications, createNotification } = require("../controllers/notificationController");

const router = express.Router();

// Get notifications for the authenticated user
router.get("/", protect, getNotifications);

// Create a new notification (this can be called from various actions like friend request, new message, etc.)
router.post("/create", protect, createNotification);

module.exports = router;
