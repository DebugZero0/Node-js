import { io } from "socket.io-client";
import { store } from "../../../app/app.store.js";

let socket = null;

export const initializeSocketConnection = () => {
    if (socket) return socket;

    socket = io(
        import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? undefined : "http://localhost:3000"),
        {
            withCredentials: true,
            auth: (cb) => cb({ token: store.getState().auth.accessToken }),
        }
        )

    socket.on("connect", () => {
        console.log("Connected to Socket.IO server with ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const sendMessageSocket = (message, chatId, projectId, attachments) => {
    if (!socket) throw new Error("Socket not initialized");
    socket.emit("send_message", { message, chatId, projectId, attachments });
};

export const onAiStart = (callback) => {
    socket?.on("ai:start", callback);
    return () => socket?.off("ai:start", callback);
};

export const onAiChunk = (callback) => {
    socket?.on("ai:chunk", callback);
    return () => socket?.off("ai:chunk", callback);
};

export const onAiDone = (callback) => {
    socket?.on("ai:done", callback);
    return () => socket?.off("ai:done", callback);
};

export const onAiError = (callback) => {
    socket?.on("ai:error", callback);
    return () => socket?.off("ai:error", callback);
};