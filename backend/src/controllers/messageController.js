const User = require('../models/User');
const Message = require('../models/Message');
const { createNotification } = require("../controllers/notificationController");

// Send a message
const sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!sender.friends.includes(receiverId)) {
            return res.status(400).json({ message: "You are not friends with this user" });
        }

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content,
        });

        await message.save();

        // await createNotification({
        //     userId: receiverId,
        //     type: "message",
        //     senderId: senderId,
        //     message: `${senderId.name} has sent you a new message`,
        // });

        res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages between two users
const getMessages = async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.body.userId;

    try {
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        })
        .sort({ createdAt: 1 })
        .populate("sender", "name email")
        .populate("receiver", "name email");

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendMessage, getMessages };
