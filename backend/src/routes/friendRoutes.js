const express = require("express");
const { 
    sendFriendRequest, 
    handleFriendRequest,
    viewFriendRequest, 
    listFriends,
    unfriend, 
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Send a friend request
router.post("/send", protect, sendFriendRequest);

//accept/reject friend request
router.put("/handle-request", protect, handleFriendRequest)

// View friend requests
router.get("/requests", protect, viewFriendRequest);

// List all friends
router.get("/myfriends", protect, listFriends);
router.post("/unfriend", protect, unfriend);

module.exports = router;
