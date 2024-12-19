const { Server } = require("socket.io");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Update with frontend URL in production
            methods: ["GET", "POST"]
        }
    });

    // Listen for new connections
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Handle incoming messages
        socket.on("sendMessage", ({ senderId, recipientId, message }) => {
            // Emit the message to the recipient
            io.to(recipientId).emit("receiveMessage", {
                senderId,
                message,
                timestamp: new Date()
            });
        });

        // Handle user disconnect
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = setupSocket;
