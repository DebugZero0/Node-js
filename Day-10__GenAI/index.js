import readline from 'readline/promises';

import { ChatMistralAI } from "@langchain/mistralai";
import {HumanMessage,tool,createAgent} from "langchain" // For creating human messages to maintain conversation history
import {sendEmail} from "./services/mail.service.js"; 
import { sendResult } from "./services/search.service.js"; // Import the search tool you created in gen.js
import * as z from "zod"; // To define the schema(format) for the tool's input parameters
import "dotenv/config";

// Create a tool for sending emails using the sendEmail function
const emailTool = tool(
    async ({ to, subject, html }) => sendEmail(to, subject, html),
    {
        name: "emailTool",
        description: "Use this tool to send email to users",
        schema: z.object({
            to: z.string().describe("Email address of the recipient"),
            subject: z.string().describe("Subject of the email").max(100),
            html: z.string().describe("HTML content of the email")
        })
    }
)
// Create a tool for searching information on the web using the searchTool function from gen.js
const searchTool = tool(
    async ({ query }) => sendResult({ query }),
    {
        name: "searchTool",
        description: "Use this tool to search for information on the web",
        schema: z.object({
            query: z.string().describe("The search query to find information on the web")
        })
    }
)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const model = new ChatMistralAI({
    model: "mistral-small-latest",
});

// Create an agent that can use the email tool
const agent = createAgent(
    {
        model,
        tools:[emailTool,searchTool] ,

    }
)

const messages=[]

while (true) {
    const answer = await rl.question("\x1b[34mYou:\x1b[0m ");

    messages.push(new HumanMessage(answer)) // Add the user's message to the conversation history
    const response = await agent.invoke({ messages }); // Pass the entire conversation history to the agent, invoke message as object for agent
    const assistantMessage = response.messages?.[response.messages.length - 1];
    if (assistantMessage) {
        messages.push(assistantMessage) // Add the AI's response to the conversation history
        console.log(`\x1b[32mAI:\x1b[0m ${assistantMessage.content}`); // Print the AI's response
    }
}
rl.close();