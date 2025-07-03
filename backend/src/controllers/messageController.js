const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { createNotification } = require("../controllers/notificationController");

// Send a message
const sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    try {
        // Log incoming request data
        console.log("Incoming message request:", { senderId, receiverId, content });
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!sender.friends.includes(receiverId)) {
            return res.status(400).json({ message: "You are not friends with this user" });
        }

        // Check if a conversation already exists between the two users
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });
    
        // If no conversation exists, create a new one
        if (!conversation) {
            conversation = new Conversation({
            participants: [senderId, receiverId],
            });
            await conversation.save();
            console.log(conversation);
        }
        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
        });

        await message.save();
        // Update the conversation with the latest message
        conversation.latestMessage = message._id;
        
        res.status(200).json({ message, conversation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name email profilePicture")
      .populate({
          path: "latestMessage",
          populate: { path: "sender receiver", select: "name email profilePicture" }
        });
      // Check if conversations were found
  if (!conversations || conversations.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteConversation = async (req, res) => {
  const { conversationId } = req.params;

  try {
      // Find the conversation
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if the user is a participant in the conversation
      const userId = req.user.id;
      if (!conversation.participants.includes(userId)) {
          return res.status(403).json({ message: "You are not authorized to delete this conversation" });
      }

      // Delete the conversation
      await Conversation.findByIdAndDelete(conversationId);

      // Delete all messages related to this conversation
      await Message.deleteMany({ conversation: conversationId });

      res.status(200).json({ message: "Conversation and messages deleted successfully" });
  } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
    const { conversationId } = req.params;
  
    try {
      const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "name email")
        .populate("receiver", "name email");
  
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      res.status(500).json({ message: error.message });
    }
  };

  const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if the user is authorized to delete (sender or receiver)
        if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this message" });
        }

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: error.message });
    }
};

  
  



module.exports = { sendMessage, getMessages, getConversations, deleteConversation, deleteMessage};
