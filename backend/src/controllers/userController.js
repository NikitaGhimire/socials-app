const User = require('../models/User')
const jwt = require("jsonwebtoken"); 


//generate jwt
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
    });
};

// Register a new user
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password, bio: "", statusMessage:"Busy", profilePicture: process.env.DEFAULT_CLOUDINARY_PROFILE_PIC });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
            statusMessage: "Busy", // Default status message
            bio: "", // Default bio (empty)
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// User login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio || "",
                statusMessage: user.statusMessage || "Busy",
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user profile (protected route)
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select('name email profilePicture statusMessage');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        // Debug logging
        console.log("Request body:", req.body);
        console.log("Uploaded file:", req.file);

        // Find user and handle not found case
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user fields if provided
        if (req.body.name) user.name = req.body.name;
        if (req.body.bio) user.bio = req.body.bio;
        if (req.body.statusMessage) user.statusMessage = req.body.statusMessage;

        // Handle profile picture upload
        if (req.file) {
            try {
                const cloudinaryUrl = req.file.secure_url || req.file.path;
                if (!cloudinaryUrl) {
                    throw new Error('No secure URL provided by Cloudinary');
                }
                user.profilePicture = cloudinaryUrl;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(400).json({ 
                    message: "Error uploading profile picture",
                    error: uploadError.message 
                });
            }
        }

        // Ensure default profile picture if none exists
        if (!user.profilePicture) {
            user.profilePicture = process.env.DEFAULT_CLOUDINARY_PROFILE_PIC;
        }

        // Save user and handle validation errors
        const updatedUser = await user.save();
        if (!updatedUser) {
            throw new Error('Failed to save user updates');
        }

        // Send success response
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.bio,
            statusMessage: updatedUser.statusMessage,
            profilePicture: updatedUser.profilePicture,
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        
        // Handle different types of errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation Error", 
                errors: Object.values(error.errors).map(err => err.message)
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        res.status(500).json({ 
            message: "Error updating profile",
            error: error.message
        });
    }
};

const getAllUsers = async(req, res) => {
    try {
        // Fetch all users except the logged-in user
        const users = await User.find({ _id: { $ne: req.user._id } }); // Assuming req.user is populated with logged-in user's info
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Delete all users
const deleteAllUsers = async (req, res) => {
    try {
        // // Check if the user has admin privileges (you can modify this logic based on your needs)
        // if (!req.user.isAdmin) {
        //     return res.status(403).json({ message: "You do not have permission to delete users" });
        // }

        // Delete all users except for the logged-in admin
        const deletedUsers = await User.deleteMany({ _id: { $ne: req.user._id } });

        if (deletedUsers.deletedCount === 0) {
            return res.status(404).json({ message: "No users found to delete" });
        }

        res.status(200).json({
            message: `${deletedUsers.deletedCount} user(s) deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting users:", error);
        res.status(500).json({ message: error.message });
    }
};

  

module.exports = { registerUser, 
                    loginUser, 
                    getUserProfile, 
                    updateUserProfile, 
                    getAllUsers,
                    deleteAllUsers
                  };