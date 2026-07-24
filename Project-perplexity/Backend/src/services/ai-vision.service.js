import dotenv from "dotenv";
dotenv.config();

import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, AIMessage, SystemMessage } from "langchain";

let visionModel = null;

function getVisionModel() {
    if (visionModel) return visionModel;

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        throw new Error(
            "MISTRAL_API_KEY is not set. Add it to Backend/.env (this is the same key used for the text chat model)."
        );
    }

    visionModel = new ChatMistralAI({
        model: "pixtral-12b-2409", // Mistral's vision-capable model
        apiKey,
    });

    return visionModel;
}

function buildImageContentBlocks(imageAttachments) {
    return imageAttachments.map((img) => ({
        type: "image_url",
        image_url: img.previewUrl, // data:<mime>;base64,<data>
    }));
}

function convertHistoryWithImages(messages, imageAttachments) {
    return messages
        .map((msg, index) => {
            const isLast = index === messages.length - 1;
            if (msg.role === "user") {
                if (isLast && imageAttachments.length > 0) {
                    return new HumanMessage({
                        content: [
                            { type: "text", text: msg.content },
                            ...buildImageContentBlocks(imageAttachments),
                        ],
                    });
                }
                return new HumanMessage(msg.content);
            }
            if (msg.role === "assistant") return new AIMessage(msg.content);
            return null;
        })
        .filter(Boolean);
}

export async function generateVisionResponseStream(messages, imageAttachments, onToken, contextText = "") {
    const model = getVisionModel();

    const normalizedMessages = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];
    const converted = convertHistoryWithImages(normalizedMessages, imageAttachments);

    if (contextText) {
        converted.unshift(
            new SystemMessage(
                `The user has attached files and/or a project for context. Use the following excerpts and image contents to answer when relevant; ignore them if they don't apply.\n\n${contextText}`
            )
        );
    }

    let fullText = "";
    const stream = await model.stream(converted);

    for await (const chunk of stream) {
        let text = "";
        if (typeof chunk.content === "string") {
            text = chunk.content;
        } else if (Array.isArray(chunk.content)) {
            text = chunk.content
                .filter((block) => block.type === "text")
                .map((block) => block.text)
                .join("");
        }
        if (text) {
            fullText += text;
            onToken(text);
        }
    }

    return fullText;
}