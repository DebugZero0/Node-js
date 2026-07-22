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
    systemPrompt: `You are a helpful assistant. Today's date is ${new Date().toDateString()}.${new Date().toLocaleTimeString()}.
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

    if (projectContext) {
        converted.unshift(
            new SystemMessage(
                `The user has attached a project's codebase for context. Use the following excerpts to answer when relevant; ignore them if they don't apply.\n\n${projectContext}`
            )
        );
    }

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

export async function generateResponseStream(messages, onToken, projectContext = "") {
    const normalizedMessages = Array.isArray(messages) ? messages : [{ role: "user", content: messages }];

    const converted = normalizedMessages
        .map((msg) => {
            if (msg.role === "user") return new HumanMessage(msg.content);
            if (msg.role === "assistant") return new AIMessage(msg.content);
            return null;
        })
        .filter(Boolean);

    if (projectContext) {
        converted.unshift(
            new SystemMessage(
                `The user has attached a project's codebase for context. Use the following excerpts to answer when relevant; ignore them if they don't apply.\n\n${projectContext}`
            )
        );
    }

    let fullText = "";

    const eventStream = agent.streamEvents({ messages: converted }, { version: "v2" });

    for await (const event of eventStream) {
        if (event.event === "on_chat_model_stream") {
            const chunk = event.data?.chunk;

            // Tool-call fragments are NOT displayable answer text — skip them entirely
            const hasToolCallChunks = Array.isArray(chunk?.tool_call_chunks) && chunk.tool_call_chunks.length > 0;
            const hasToolCalls = Array.isArray(chunk?.tool_calls) && chunk.tool_calls.length > 0;
            if (hasToolCallChunks || hasToolCalls) {
                continue; // don't stream, don't append to fullText
            }

            let text = "";
            if (chunk?.content) {
                if (Array.isArray(chunk.content)) {
                    text = chunk.content
                        .filter((block) => block.type === "text")
                        .map((block) => block.text)
                        .join("");
                } else if (typeof chunk.content === "string") {
                    text = chunk.content;
                }
            }

            if (text) {
                fullText += text;
                onToken(text);
            }
        }
    }

    return fullText;
}