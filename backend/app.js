
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db"); // Import the DB connection function

const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // Enable CORS for all requests
app.use(express.json()); // Parse incoming JSON requests

// Database connection
connectDB(); // Connect to MongoDB

// Sample route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Export the app to use it in server.js
module.exports = app;
