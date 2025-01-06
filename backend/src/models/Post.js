const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      text: { type: String, default: "" },
      image: { type: String }, // Path to uploaded image
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        commenter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    visibility: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Friends who can view the post
      },
    ],
  },
  { timestamps: true }
);

// Middleware to set post visibility to the author's friends
postSchema.pre("save", async function (next) {
  if (this.isNew) {
    const User = mongoose.model("User");
    const author = await User.findById(this.author).populate("friends");
    this.visibility = author.friends.map((friend) => friend._id);
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
