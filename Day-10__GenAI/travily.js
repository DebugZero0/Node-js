import { tavily } from "@tavily/core";
import "dotenv/config";
import readline from "readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const client = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});

while (true) {
    const answer = await rl.question("\x1b[34mYou:\x1b[0m ");
    const response = await client.search(answer);
    
    console.log("\x1b[32mAI:\x1b[0m ", response.results[0].content);
}
rl.close();
