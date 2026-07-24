import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import ChatModel from '../models/chat.model.js';
import MessageModel from '../models/message.model.js';
import { generateResponseStream, generateChatTitle } from '../services/ai.service.js';
import { generateVisionResponseStream } from '../services/ai-vision.service.js';
import { consumeMessageQuota } from '../utils/rateLimiter.js';
import { retrieveContext } from '../services/rag.service.js';

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

        socket.on('send_message', async ({ message, chatId, projectId, attachments }) => {
            try {
                if (!message || !message.trim()) {
                    socket.emit('ai:error', { error: 'Message is required' });
                    return;
                }

                const quota = await consumeMessageQuota(socket.userId);
                if (!quota.allowed) {
                    socket.emit('ai:error', { error: quota.message });
                    return;
                }

                let chat = null;
                let title = null;

                if (chatId) {
                    chat = await ChatModel.findOne({ _id: chatId, userId: socket.userId });
                    if (!chat) { socket.emit('ai:error', { error: 'Chat not found' }); return; }
                } else {
                    title = await generateChatTitle(message);
                    chat = await ChatModel.create({ userId: socket.userId, title, summary: "", projectId: projectId || null });
                }

                const userMessage = await MessageModel.create({
                    chatId: chat._id,
                    userId: socket.userId,
                    role: 'user',
                    content: message.trim(),
                });

                socket.emit('ai:start', { chat, title, userMessage });

                let contextText = "";
                if (chat.projectId) {
                    try {
                        contextText = await retrieveContext(chat.projectId, message.trim());
                    } catch (err) {
                        console.error('RAG retrieval failed:', err.message);
                    }
                }

                const imageAttachments = Array.isArray(attachments)
                    ? attachments.filter((a) => a.kind === "image" && a.previewUrl)
                    : [];

                // Fold text-file attachment content into the context blob either way
                if (Array.isArray(attachments) && attachments.length > 0) {
                    const attachmentContext = attachments
                        .filter((a) => a.kind === "text" && a.content)
                        .map((a) => `File: ${a.name}${a.truncated ? " (truncated)" : ""}\n${a.content}`)
                        .join("\n\n---\n\n");

                    if (attachmentContext) {
                        contextText = contextText ? `${contextText}\n\n---\n\n${attachmentContext}` : attachmentContext;
                    }
                }

                const history = await MessageModel.find({ chatId: chat._id }).sort({ createdAt: 1 }).select('role content');

                const onToken = (tokenText) => {
                    socket.emit('ai:chunk', { chatId: chat._id.toString(), token: tokenText });
                };

                // Images present → route through the vision-capable model.
                // No images → keep the existing web-search agent for text-only turns.
                const fullText = imageAttachments.length > 0
                    ? await generateVisionResponseStream(history, imageAttachments, onToken, contextText)
                    : await generateResponseStream(history, onToken, contextText);

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