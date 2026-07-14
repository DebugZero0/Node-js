import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import http from "http";
import { initsocket } from "./src/sockets/server.socket.js";

// import { generateResponse } from "./src/services/ai.service.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initsocket(httpServer);


const startServer = async () => {
    try {
        await connectDB();
        
        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error.message);
        process.exit(1);
    }
};
// generateResponse();

startServer();

