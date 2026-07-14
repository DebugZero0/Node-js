import { Server } from 'socket.io';

let io; // Represents the Socket.IO server instance


// Fucntion to initialize the Socket.IO server side
export function initsocket(httpServer) {
    // Initialize Socket.IO server
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173', // Allow all origins (you can specify your frontend URL here)
            credentials: true, // Allow credentials (cookies, authorization headers, etc.)
        },
    });

    console.log("Socket IO server is running ✅")
    // Handle Socket.IO connections
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
        // Handle custom events here

    });
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.IO server not initialized. Call initsocket first.');
    }
    return io;
}
