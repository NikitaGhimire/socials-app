const express = require("express");
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    deleteAllUsers
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
router.put("/update-profile", protect, upload.single("profilePicture"),updateUserProfile);

router.get("/getAllUsers", protect, getAllUsers);

//admin role

router.delete('/delete-all-users', protect, deleteAllUsers);

module.exports = router;




