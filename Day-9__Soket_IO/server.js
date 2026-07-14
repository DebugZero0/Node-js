import app from "./src/app.js";
import {createServer} from "http";
import { Server } from "socket.io";

const httpServer = createServer(app); // Create an HTTP server using the Express app
const io = new Server(httpServer); // Create a Socket.IO server and attach it to the HTTP server


io.on("connection", (socket) => { // Listen for new client connections
  console.log(`User connected`);

  socket.on("message",(data)=>{
    io.emit("message", data); // Broadcast the message to all connected clients
  })
});

httpServer.listen(3000, () => { // Start the HTTP server on port 3000
  console.log("Server is running on port 3000");
});

