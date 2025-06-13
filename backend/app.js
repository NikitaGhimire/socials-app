const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db"); 
const path = require("path");
const userRoutes = require("./src/routes/userRoutes");
const friendRoutes = require("./src/routes/friendRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const postRoutes = require("./src/routes/postRoutes");
const compression = require('compression');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://messaging-app-ebon-two.vercel.app'
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
})); 
app.use(express.json()); 

app.use(compression()); 

// Serve static files from the "src/uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// cache control middleware
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  next();
});

// Database connection
connectDB(); 

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
