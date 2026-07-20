import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import ChatModel from '../models/chat.model.js';
import MessageModel from '../models/message.model.js';
import { generateResponseStream, generateChatTitle } from '../services/ai.service.js';

let io;

export function initsocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
    });

    // Authenticate every socket connection the same way REST does
    io.use((socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie || "";
            const cookies = cookie.parse(rawCookie);
            const token = socket.handshake.auth?.token || cookies.accessToken;

            if (!token) return next(new Error("Unauthorized"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });

    console.log("Socket IO server is running ✅");

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id, 'user:', socket.userId);

        socket.on('send_message', async ({ message, chatId }) => {
            try {
                if (!message || !message.trim()) {
                    socket.emit('ai:error', { error: 'Message is required' });
                    return;
                }

                let chat = null;
                let title = null;

                if (chatId) {
                    chat = await ChatModel.findOne({ _id: chatId, userId: socket.userId });
                    if (!chat) {
                        socket.emit('ai:error', { error: 'Chat not found' });
                        return;
                    }
                } else {
                    title = await generateChatTitle(message);
                    chat = await ChatModel.create({ userId: socket.userId, title, summary: "" });
                }

                const userMessage = await MessageModel.create({
                    chatId: chat._id,
                    userId: socket.userId,
                    role: 'user',
                    content: message.trim(),
                });

                // Tell the client the chat/user message right away (important for brand-new chats)
                socket.emit('ai:start', { chat, title, userMessage });

                const history = await MessageModel.find({ chatId: chat._id })
                    .sort({ createdAt: 1 })
                    .select('role content');

                const fullText = await generateResponseStream(history, (tokenText) => {
                    socket.emit('ai:chunk', { chatId: chat._id.toString(), token: tokenText });
                });

                const aiMessage = await MessageModel.create({
                    chatId: chat._id,
                    userId: socket.userId,
                    role: 'assistant',
                    content: fullText,
                });

                chat.messageIds = [...(chat.messageIds || []), userMessage._id, aiMessage._id];
                await chat.save();

                socket.emit('ai:done', { chat, aiMessage, userMessage });
            } catch (error) {
                console.error('Error streaming AI response:', error);
                socket.emit('ai:error', { error: 'Failed to generate AI response', details: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected:', socket.id);
        });
    });
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.IO server not initialized. Call initsocket first.');
    }
    return io;
}