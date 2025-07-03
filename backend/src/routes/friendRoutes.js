const express = require("express");
const { 
    sendFriendRequest, 
    handleFriendRequest,
    viewFriendRequest, 
    listFriends,
    unfriend,
    viewSentFriendRequests, 
    deleteAllSentFriendRequests,
    searchUsers,
    cancelFriendRequest
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Send a friend request
router.post("/send", protect, sendFriendRequest);

// Cancel a sent friend request
router.post("/cancel-request", protect, cancelFriendRequest);

//accept/reject friend request
router.put("/handle-request", protect, handleFriendRequest)

// View friend requests
router.get("/requests", protect, viewFriendRequest);

// List all friends
router.get("/myfriends", protect, listFriends);
router.post("/unfriend", protect, unfriend);
router.get("/sentRequests", protect, viewSentFriendRequests);
router.delete('/sent-requests', protect, deleteAllSentFriendRequests);
router.get('/search', protect, searchUsers);

module.exports = router;
