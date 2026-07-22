import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import chatsRoutes from "./routes/chats.routes.js";
import userRouts from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import morgan from "morgan";
import cors from "cors";

const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = new Set([
    frontendOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};


const app = express();
// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); 

app.use(morgan("dev"));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/user", userRouts);
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

export default app;