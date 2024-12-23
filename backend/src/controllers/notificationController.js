const Notification = require("../models/Notification");

// Create a new notification
const createNotification = async (req, res) => {
  const { userId, type, senderId, message } = req.body;

  try {
    const notification = new Notification({
      user: userId,
      type: type,
      sender: senderId,
      message: message,
    });

    await notification.save();
    res.status(201).json({ message: "Notification created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all notifications for the authenticated user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("sender", "name email") // Populate the sender's details
      .sort("-createdAt"); // Sort notifications by the latest

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNotification, getNotifications };
