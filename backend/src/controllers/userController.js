const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const jwt = require("jsonwebtoken");

//generate jwt
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
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

        const user = await User.create({ name, email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
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
    const user = await User.findById(req.user.id).select("-password");
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.bio = req.body.bio || user.bio;
            user.statusMessage = req.body.statusMessage || user.statusMessage;

            // Check if a profile picture URL is provided
            if (req.body.profilePicture) {
                user.profilePicture = req.body.profilePicture;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                bio: updatedUser.bio,
                statusMessage: updatedUser.statusMessage,
                profilePicture: updatedUser.profilePicture,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const sendFriendRequest = async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId;
  
    try {
      // Check if the sender and receiver are the same user
      if (senderId === receiverId) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself" });
      }
  
      // Check if a friend request already exists between the two users
      const existingRequest = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
      });
  
      if (existingRequest) {
        return res.status(400).json({ message: "Friend request already sent" });
      }
  
      // Create a new friend request
      const newRequest = new FriendRequest({
        sender: senderId,
        receiver: receiverId,
      });
  
      await newRequest.save();
      res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const acceptFriendRequest = async (req, res) => {
    const senderId = req.body.senderId;
    const receiverId = req.user.id;
  
    try {
      // Find the friend request
      const request = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });
  
      if (!request) {
        return res.status(404).json({ message: "Friend request not found" });
      }
  
      // Update the status to "accepted"
      request.status = "accepted";
      await request.save();
  
      // You can optionally add the sender and receiver to each other's friend lists
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
  
      sender.friends.push(receiverId);
      receiver.friends.push(senderId);
  
      await sender.save();
      await receiver.save();
  
      res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  const rejectFriendRequest = async (req, res) => {
    const senderId = req.body.senderId;
    const receiverId = req.user.id;
  
    try {
      // Find the friend request
      const request = await FriendRequest.findOne({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });
  
      if (!request) {
        return res.status(404).json({ message: "Friend request not found" });
      }
  
      // Update the status to "rejected"
      request.status = "rejected";
      await request.save();
  
      res.status(200).json({ message: "Friend request rejected" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  const listFriends = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId).populate("friends");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(user.friends);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, listFriends };