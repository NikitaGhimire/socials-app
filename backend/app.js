const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db"); // Import the DB connection function
const path = require("path");
const userRoutes = require("./src/routes/userRoutes");
const friendRoutes = require("./src/routes/friendRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const postRoutes = require("./src/routes/postRoutes");


const app = express();

// Middleware
// Allow CORS for preflight requests
app.options('*', cors()); // Handle preflight requests for all routes

app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://messaging-app-ebon-two.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
})); // Enable CORS for all requests
app.use(express.json()); // Parse incoming JSON requests

// Serve static files from the "src/uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
connectDB(); // Connect to MongoDB

// // Catch 404 errors
// app.use((req, res, next) => {
//   res.status(404).json({ message: "Resource not found" });
// });

// General error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

//routes
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);


// Export the app to use it in server.js
module.exports = app;
