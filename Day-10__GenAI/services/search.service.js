// This agent will be responsible for search queries and will increase accuracy of the information
import { tavily } from "@tavily/core";
import "dotenv/config";

const client = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});

export const sendResult = async ({ query }) => {
    const response = await client.search(query);
    return ""+response.results[0].content;
};

// sendResult({ query: "who is the present cm of kerala" }).then(console.log);
