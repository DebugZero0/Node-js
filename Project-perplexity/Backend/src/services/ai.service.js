import dotenv from "dotenv";
dotenv.config();

import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent } from "langchain";
import { tool } from "langchain";
import { HumanMessage, AIMessage, SystemMessage } from "langchain";
import { tavily } from "tavily";
import { z } from "zod";

const model = new ChatMistralAI({
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY,
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const searchTool = tool(
    async ({ query }) => {
        const results = await tvly.search(query, { maxResults: 5 });
        return JSON.stringify(results);
    },
    {
        name: "web_search",
        description: "Search the web for current events, news, weather, prices, or any time-sensitive information.",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);

const agent = createAgent({
    model,
    tools: [searchTool],
    systemPrompt: `You are a helpful assistant. Today's date is ${new Date().toDateString()}.
    Use the web_search tool whenever the user asks about current events, news, weather, prices, or anything time-sensitive.
    For general knowledge questions, answer directly without searching.`,
});

export async function generateResponse(messages) {
    const normalizedMessages = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];

    const converted = normalizedMessages
        .map((msg) => {
            if (msg.role === "user") return new HumanMessage(msg.content);
            if (msg.role === "assistant") return new AIMessage(msg.content);
            return null;
        })
        .filter(Boolean);

    const result = await agent.invoke({ messages: converted });
    const finalMessage = result.messages[result.messages.length - 1];

    let content = finalMessage.content;
    if (Array.isArray(content)) {
        content = content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");
    }

    return content;
}

export async function generateChatTitle(message) {
    const response = await model.invoke([
        new SystemMessage(`Generate a Markdown-formatted title for the following chat message. Keep it within 2-4 words. Return only the title in bold, e.g. **Relevant Title**.`),
        new HumanMessage(`Generate a title for the following chat message: ${message}`),
    ]);
    return response.text;
}