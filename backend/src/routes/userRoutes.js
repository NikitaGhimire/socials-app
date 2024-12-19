const express = require("express");
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    viewFriendRequest,
    listFriends,
    sendMessage,
    getMessages,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// User registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Get user profile (protected)
router.get("/profile", protect, getUserProfile);

//update profile
router.put("/profile", protect, updateUserProfile); // Update profile

//handle profile picture upload
router.post("/profile/upload", protect, upload.single("profilePicture"), (req, res) => {
    try {
        res.status(200).json({ filePath: `/uploads/${req.file.filename}` });
    } catch (err) {
        res.status(500).json({ message: "File upload failed" });
    }
});

//FRIEND MANAGEMENT

// Send a friend request
router.post("/send", protect, sendFriendRequest);

// Accept a friend request
router.put("/accept", protect, acceptFriendRequest);

// Reject a friend request
router.put("/reject", protect, rejectFriendRequest);

//view friend request
router.get('/requests', protect, viewFriendRequest);

// List all friends
router.get("/friends", protect, listFriends);

//MESSAGE MGMT

// Send a message
router.post("/sendMessage", protect, sendMessage);

// Get messages between two users
router.get("/messages/:userId", protect, getMessages);

module.exports = router;
