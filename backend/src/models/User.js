const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true},
        email: { type: String, required: true, unique: true},
        password: {type: String, required: true},
        profilePicture: { type: String, default: "./uploads/default.jpg"},
        statusMessage: { type: String, default: "Busy"},
        bio: { type: String, default:""},
        online: {type: Boolean, default: false},
        friends: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
    },
    { timestamps: true}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);