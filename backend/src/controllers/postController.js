const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create a post
const createPost = async (req, res) => {
  try {
    console.log("Received request to create a post");
    const { text } = req.body;
    const userId = req.user?._id; // Assuming user info is available in req.user after authentication
    // Check if an image file was uploaded
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    console.log("User ID from request:", userId);

    if (!userId) {
        console.error("User ID not found in request");
        return res.status(400).json({ message: "User not authenticated" });
      }

    const newPost = new Post({
      author: userId,
      content: { text, image },
    });

    console.log("New post object created:", newPost); // Debugging: Log post object before saving

    await newPost.save();
    console.log("Post saved successfully:", newPost); // Debugging: Confirm post is saved
    // Populate author details
    const populatedPost = await Post.findById(newPost._id).populate("author", "name profilePicture _id");

    console.log("Populated post with author details:", populatedPost); // Debugging: Confirm populated post
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error creating post:", error); // Debugging: Log error details
    res.status(500).json({ message: "Failed to create post", error });
  }
};

// Update a post
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    console.log("Request body:", req.body);
console.log("Uploaded file:", req.file);
const image = req.file ? `/uploads/${req.file.filename}` : post.content.image;


    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    post.content.text = text || post.content.text;
    post.content.image = image || post.content.image;
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to update post", error });
  }
};

// Delete a post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error });
  }
};

// Add a like to a post
const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Already liked this post" });
    }

    post.likes.push(userId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to like post", error });
  }
};

// Add a comment to a post
const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = { commenter: userId, text };
    post.comments.push(newComment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error });
  }
};

// View posts by the user and their friends
const viewPosts = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Fetch the user's friends
      const user = await User.findById(userId).populate("friends");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Get IDs of the user and their friends
      const friendIds = user.friends.map((friend) => friend._id);
  
      // Fetch posts authored by the user or their friends
      const posts = await Post.find({
        author: { $in: [userId, ...friendIds] },
      })
        .populate("author", "name profilePicture") // Populate author details
        .populate("comments.commenter", "name profilePicture") // Populate commenter details
        .sort({ createdAt: -1 }); // Sort posts by newest first
  
      res.status(200).json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts", error });
    }
  };
  

module.exports = { addComment, createPost, updatePost, likePost, viewPosts, deletePost};