const express = require("express");
const { sendMessage, getMessages } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Send a message
router.post("/sendMessage", protect, sendMessage);

// Get messages between two users
router.get("/view-messages", protect, getMessages);

module.exports = router;
