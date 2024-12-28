const express = require("express");
const { sendMessage, getMessages, getConversations, deleteConversation, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Send a message
router.post("/sendMessage", protect, sendMessage);

// // Get messages between two users
// router.get("/view-messages", protect, getMessages);

// Get all conversations for a user
router.get("/chats", protect, getConversations);

// Get messages in a conversation
router.get("/:conversationId", protect, getMessages);

//Delete a conversation
router.delete('/delete/:conversationId', protect, deleteConversation);

//Delete a message
router.delete("/:messageId", protect, deleteMessage);


module.exports = router;
