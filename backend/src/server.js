const app = require('./src/app');
const http = require('http');
const socketIO = require('socket.io');

//creating http server using express app
const server = http.createServer(app);

//setting up socket.io
const io = socketIO(server);

io.on('connection', (socket) => {
    console.log('New client connected');

    //event listener for socket comm if needed
    socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

