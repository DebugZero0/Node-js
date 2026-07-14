import dotenv from "dotenv";
dotenv.config();

import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage } from "langchain";

const model = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY,
});

// HumanMessage is used to send input to the model
export async function generateResponse(messages) {
    const normalizedMessages = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];

    const response = await model.invoke(
        normalizedMessages
            .map((msg) => {
                if (msg.role === "user") {
                    return new HumanMessage(msg.content);
                }

                if (msg.role === "assistant") {
                    return new AIMessage(msg.content);
                }

                return null;
            })
            .filter(Boolean)
    );
    return response.text;
}

// SystemMessage is used for custom instructions
export async function generateChatTitle(message) {
    const response = await model.invoke([
        new SystemMessage(`
        Generate a Markdown-formatted title for the following chat message.
        The user will provide a first message, and you will generate a concise and relevant title for the chat.
        Keep it within 2-4 words.
        Return only the title in Markdown format, preferably bold text like **Relevant Title**.
        `),
        new HumanMessage(`Generate a title for the following chat message: ${message}`),
    ]);

    return response.text;
}
