const express = require("express");
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
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

module.exports = router;
