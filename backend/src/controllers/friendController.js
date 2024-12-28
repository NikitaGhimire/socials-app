const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { createNotification } = require("../controllers/notificationController");
const mongoose = require("mongoose");

//send friend request
const sendFriendRequest = async (req, res) => {
  console.log("sendFriendRequest called");
    // console.log("Request body at start:", req.body);
    const senderId = req.user.id;
    // console.log("Request body:", req.body);
    const receiverId = req.body.userId;
    if (!req.body || !receiverId) {
      // console.log("Invalid request body:", req.body);
      return res.status(400).json({ message: "userId is required in the request body" });
  }
  
    try {
      // console.log("Validation passed, proceeding...");
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
  
      const savedRequest = await newRequest.save();
      // Log to confirm the request was saved
      console.log("Friend request saved:", savedRequest);

      res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
      // console.error("Error occurred:", error.message);
      res.status(500).json({ message: error.message });
    }
  };

  //accept/reject/delete friend request
  const handleFriendRequest = async (req, res) => {
    const receiverId = req.user.id;
    const { senderId, action } = req.body; // `action` can be "accept" or "reject"
  
    console.log(`${action.charAt(0).toUpperCase() + action.slice(1)}ing friend request:`);
    console.log("Receiver ID (current user):", receiverId);
    console.log("Sender ID (from request body):", senderId);
  
    try {
      // Ensure receiverId and senderId are ObjectId instances
      const receiverObjectId = new mongoose.Types.ObjectId(receiverId);
      const senderObjectId = new mongoose.Types.ObjectId(senderId);
  
      // Find the friend request
      const request = await FriendRequest.findOne({
        sender: senderObjectId,
        receiver: receiverObjectId,
        status: "pending",
      });
  
      console.log("Friend request found:", request);
  
      if (!request) {
        return res.status(404).json({ message: "Friend request not found" });
      }
  
      if (action === "accept") {
        // Update the status to "accepted"
        request.status = "accepted";
        await request.save();
  
        // Add the sender and receiver to each other's friend lists
        const sender = await User.findById(senderObjectId);
        const receiver = await User.findById(receiverObjectId);
  
        if (!sender || !receiver) {
          return res.status(404).json({ message: "Sender or receiver not found" });
        }
  
        sender.friends.push(receiverObjectId);
        receiver.friends.push(senderObjectId);
  
        await sender.save();
        await receiver.save();
  
        res.status(200).json({ message: "Friend request accepted" });
      } else if (action === "reject") {
        // Update the status to "rejected"
        request.status = "rejected";
        await request.save();
  
        res.status(200).json({ message: "Friend request rejected" });
      } else if (action === "delete") {
        // Delete the pending friend request
        await FriendRequest.deleteOne({ _id: request._id });
  
        res.status(200).json({ message: "Friend request deleted successfully" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error(`Error handling friend request (${action}):`, error);
      res.status(500).json({ message: error.message });
    }
  };
  

  const viewFriendRequest = async (req, res) => {
    try {
      // const {userId} = req.query; 
      const userId = req.user.id;
  
      // Find only friend requests where the user is the receiver
    const friendRequests = await FriendRequest.find({ receiver: userId, status: 'pending' }) 
    .populate('sender', 'name email')  // Populate sender details
    .populate('receiver', 'name email');  // Optionally populate receiver details
  
  
      res.status(200).json({
        total: friendRequests.length,
        friendRequests,
      });
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  };
  
  
  const listFriends = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId).populate({
        path: 'friends',
        select: '-friends',  // Exclude the 'friends' field from being populated
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove duplicate friends (if any) from the array
    const uniqueFriends = Array.from(new Set(user.friends.map(friend => friend._id.toString())))
    .map(id => user.friends.find(friend => friend._id.toString() === id));
  
      res.status(200).json({
        totalFriends: uniqueFriends.length, 
        uniqueFriends});
        
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const unfriend = async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.body;
    try{
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const friendObjectId = new mongoose.Types.ObjectId(friendId);

      // Find the current user and the friend
    const user = await User.findById(userObjectId);
    const friend = await User.findById(friendObjectId);
    if (!user || !friend) {
      return res.status(404).json({ message: "User or friend not found" });
    }

    // Remove the friend from each other's friends list
    user.friends = user.friends.filter((id) => !id.equals(friendObjectId));
    friend.friends = friend.friends.filter((id) => !id.equals(userObjectId));

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error while removing friend:", error);
    res.status(500).json({ message: error.message });
  }
};

const viewSentFriendRequests = async (req, res) => {
  try {
      const senderId = req.user.id;

      // Find all friend requests where the user is the sender and the status is 'pending'
      const sentRequests = await FriendRequest.find({ sender: senderId, status: 'pending' })
          .populate('sender', 'name email')  // Populate sender details
          .populate('receiver', 'name email');  // Populate receiver details

      res.status(200).json({
          total: sentRequests.length,
          sentRequests,
      });
  } catch (error) {
      console.error("Error fetching sent friend requests:", error);
      res.status(500).json({ error: "Failed to fetch sent friend requests" });
  }
};

const deleteAllSentFriendRequests = async (req, res) => {
  const senderId = req.user.id;

  try {
    // Delete all pending friend requests sent by the logged-in user
    const deletedRequests = await FriendRequest.deleteMany({
      sender: senderId,
      status: "pending"
    });

    if (deletedRequests.deletedCount === 0) {
      return res.status(404).json({ message: "No sent friend requests found" });
    }

    res.status(200).json({ message: `${deletedRequests.deletedCount} friend request(s) deleted successfully` });
  } catch (error) {
    console.error("Error deleting sent friend requests:", error);
    res.status(500).json({ message: error.message });
  }
};


  module.exports = { sendFriendRequest, handleFriendRequest, listFriends, viewFriendRequest, unfriend, viewSentFriendRequests, deleteAllSentFriendRequests };
