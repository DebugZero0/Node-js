
import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import ChatModel from "../models/chat.model.js";
import MessageModel from "../models/message.model.js";

export async function sendMessage(req, res) {
    const { message, chatId } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        let chat = null;
        let title = null;

        if (chatId) {
            chat = await ChatModel.findOne({ _id: chatId, userId });
            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
            }
        } else {
            title = await generateChatTitle(message);
            chat = await ChatModel.create({
                userId,
                title,
                summary: "",
            });
        }

        // Create the user message first so the stored history matches the prompt we send to the model.
        const userMessage = await MessageModel.create({
            chatId: chat._id,
            userId,
            role: "user",
            content: message.trim(),
        });

        const messages = await MessageModel.find({ chatId: chat._id }).sort({ createdAt: 1 }).select("role content");
        const result = await generateResponse(messages);

        const AImessage = await MessageModel.create({
            chatId: chat._id,
            userId,
            role: "assistant",
            content: result,
        });

        chat.messageIds = [...(chat.messageIds || []), userMessage._id, AImessage._id];
        await chat.save();

        res.status(200).json({ title, chat, AImessage });

        // res.status(200).json({ title, response: result });
    }
    catch (error) {
        console.error("Error generating AI response:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
}

export async function getChats(req, res) {
    const userId = req.user?.id || req.user?._id || req.userId;

    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        const chats = await ChatModel.find({ userId }).sort({ updatedAt: -1 }); // Sort chats by updatedAt in descending order
        res.status(200).json({ chats });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
}

export async function getMessages(req, res) {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { chatId } = req.params;
    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        const messages = await MessageModel.find({ chatId });
        res.status(200).json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}

export async function deleteChat(req, res) {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { chatId } = req.params;

    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        const chat = await ChatModel.findOneAndDelete({ _id: chatId, userId });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        // Delete all messages associated with the chat
        await MessageModel.deleteMany({ chatId: chat._id });
        res.status(200).json({ message: "Chat and associated messages deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
}

export async function updateChatTitle(req, res) {
    const userId = req.user?.id || req.user?._id || req.userId;
    const { chatId } = req.params;
    const { title } = req.body;
    const trimmedTitle = typeof title === "string" ? title.trim() : "";

    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        if (!trimmedTitle) {
            return res.status(400).json({ error: "Chat title is required" });
        }

        const chat = await ChatModel.findOneAndUpdate({ _id: chatId, userId }, { title: trimmedTitle }, { new: true });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        res.status(200).json({ chat });
    } catch (error) {
        console.error("Error updating chat title:", error);
        res.status(500).json({ error: "Failed to update chat title" });
    }
}

