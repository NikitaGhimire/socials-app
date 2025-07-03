const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { createNotification } = require("../controllers/notificationController");
const mongoose = require("mongoose");

//send friend request
const sendFriendRequest = async (req, res) => {
    console.log("sendFriendRequest called");
    const senderId = req.user.id;
    const { userId: receiverId } = req.body;
    
    try {
        // Validate request
        if(!receiverId) {
            return res.status(400).json({message: "Receiver ID is required"});
        }
        if(senderId === receiverId) {
            return res.status(400).json({message: "Can't send request to yourself"});
        }

        // Check existing friendship and requests in both directions
        const [existingFriendship, existingSentRequest, existingReceivedRequest] = await Promise.all([
            User.findOne({_id: senderId, friends: receiverId }),
            FriendRequest.findOne({
                sender: senderId,
                receiver: receiverId,
                status: 'pending'
            }),
            FriendRequest.findOne({
                sender: receiverId,
                receiver: senderId,
                status: 'pending'
            })
        ]);

        // Check scenarios in order
        if (existingFriendship) {
            return res.status(400).json({message: "Already friends with the user"});
        }

        if (existingReceivedRequest) {
            return res.status(400).json({
                message: "This user has already sent you a friend request",
                suggestion: "Check your friend requests to accept or reject"
            });
        }

        if (existingSentRequest) {
            return res.status(400).json({message: "Friend request already sent"});
        }

        // Create and save new request
        const newRequest = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: "Friend request sent successfully",
            request: newRequest
        });
    } catch(error) {
        console.error("Send friend request error:", error);
        res.status(500).json({message: "Failed to send friend request"});
    }
};

  //accept/reject/delete friend request
  const handleFriendRequest = async (req, res) => {
    const receiverId = req.user.id;
    const { requestId, action } = req.body;

    // Validation
    if (!requestId || !action) {
        return res.status(400).json({ 
            message: "Missing required parameters",
            received: { requestId, action }
        });
    }

    if (!['accept', 'reject', 'delete'].includes(action)) {
        return res.status(400).json({ 
            message: "Invalid action. Must be 'accept', 'reject', or 'delete'" 
        });
    }

    try {
        // Find the friend request
        const request = await FriendRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // For delete action, verify the user is the sender
        if (action === 'delete' && request.sender.toString() !== receiverId) {
            return res.status(403).json({ message: "Only the sender can delete their request" });
        }

        // For accept/reject, verify the user is the receiver
        if (['accept', 'reject'].includes(action) && request.receiver.toString() !== receiverId) {
            return res.status(403).json({ message: "Unauthorized to handle this request" });
        }

        switch (action) {
            case "accept":
                // Add users to each other's friend lists
                const [sender, receiver] = await Promise.all([
                    User.findById(request.sender),
                    User.findById(receiverId)
                ]);

                if (!sender || !receiver) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Update friend lists
                sender.friends.addToSet(receiverId);
                receiver.friends.addToSet(request.sender);

                // Save changes and delete the request
                await Promise.all([
                    sender.save(),
                    receiver.save(),
                    FriendRequest.findByIdAndDelete(requestId)
                ]);

                return res.status(200).json({
                    success: true,
                    message: "Friend request accepted",
                    newFriend: {
                        _id: sender._id,
                        name: sender.name,
                        email: sender.email,
                        profilePicture: sender.profilePicture,
                        statusMessage: sender.statusMessage
                    }
                });

            case "reject":
                // Delete the rejected request
                await FriendRequest.findByIdAndDelete(requestId);
                return res.status(200).json({
                    success: true,
                    message: "Friend request rejected"
                });

            case "delete":
                // Delete the sent request
                await FriendRequest.findByIdAndDelete(requestId);
                return res.status(200).json({
                    success: true,
                    message: "Friend request deleted"
                });
        }

    } catch (error) {
        console.error(`Error handling friend request:`, error);
        res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
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

// search users by name or email
const searchUsers = async (req, res) => {
  try {
      const { query } = req.query;
      const currentUserId = req.user.id;

      if (!query) {
          return res.status(400).json({ message: "Search query is required" });
      }

      // Search users by name or email, excluding the current user
      const users = await User.find({
          $and: [
              {
                  $or: [
                      { name: { $regex: query, $options: 'i' } },  // Case-insensitive name search
                      { email: { $regex: query, $options: 'i' } }  // Case-insensitive email search
                  ]
              },
              { _id: { $ne: currentUserId } }  // Exclude current user
          ]
      }).select('name email profilePicture statusMessage');

      if (!users || users.length === 0) {
          return res.status(404).json({ message: "No users found matching your search" });
      }

      res.status(200).json({
          count: users.length,
          users: users
      });

  } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ 
          message: "Error searching users",
          error: error.message 
      });
  }
};

// Cancel sent friend request
const cancelFriendRequest = async (req, res) => {
    const senderId = req.user.id;
    const { userId: receiverId } = req.body;
    
    try {
        if (!receiverId) {
            return res.status(400).json({ message: "Receiver ID is required" });
        }

        // Find and delete the pending friend request
        const deletedRequest = await FriendRequest.findOneAndDelete({
            sender: senderId,
            receiver: receiverId,
            status: 'pending'
        });

        if (!deletedRequest) {
            return res.status(404).json({ 
                message: "No pending friend request found"
            });
        }

        res.status(200).json({ 
            success: true,
            message: "Friend request canceled successfully" 
        });
    } catch (error) {
        console.error("Error canceling friend request:", error);
        res.status(500).json({ 
            message: "Error canceling friend request",
            error: error.message 
        });
    }
};

module.exports = { 
  sendFriendRequest, 
  handleFriendRequest, 
  listFriends, 
  viewFriendRequest, 
  unfriend, 
  viewSentFriendRequests, 
  deleteAllSentFriendRequests,
  searchUsers,
  cancelFriendRequest
};
