const { Server } = require("socket.io");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3001", // Update with frontend URL in production
            methods: ["GET", "POST"]
        }
    });

    // Listen for new connections
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Handle incoming messages
        socket.on("sendMessage", ({ senderId, recipientId, message }) => {
            // Ensure receipientId exists before emitting
            if(io.sockets.sockets.get(recipientId)) {
                io.to(recipientId).emit("receiveMessage", {
                senderId,
                message,
                timestamp: new Date()
                });
            } else {
            console.log(`Recipient with ID ${recipientId} not connected`);
            }
        });

        // Handle user disconnect
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = setupSocket;
