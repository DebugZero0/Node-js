import dotenv from "dotenv" // Used to load environment variables from a .env file
dotenv.config() // Load environment variables from the .env file

import { PDFParse } from "pdf-parse" // Used to parse PDF files
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters" // Used to split text into chunks
import { MistralAIEmbeddings } from "@langchain/mistralai" // Used to generate embeddings for the text chunks
import { Pinecone } from "@pinecone-database/pinecone" // Used to interact with the Pinecone vector database
import fs from "fs" // Used to read files from the filesystem

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY 
})
const index=pc.index("cohort-2-rag") // Initialize the Pinecone index for storing embeddings 

let dataBuffer = fs.readFileSync("story.pdf") // Read the PDF file into a buffer

let parsed = await new PDFParse({
    data: dataBuffer
}) // Parse the PDF file

const data = await parsed.getText() // Extract the text from the parsed PDF

const embeddings = new MistralAIEmbeddings({
    model: "mistral-embed", // Specify the Mistral model to use for generating embeddings
    apiKey: process.env.MISTRALAI_API_KEY // Use the API key from environment variables
}) 

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Set the chunk size to 1000 characters
    chunkOverlap: 200 // Set the chunk overlap to 200 characters
})

const chunks = await textSplitter.splitText(data.text) // Split the text into chunks

const docs= await Promise.all(chunks.map(async (chunk) => {
    const embedding = await embeddings.embedQuery(chunk) // Generate embeddings for each chunk
    return {
        text: chunk, // Store the chunk text
        embedding: embedding // Store the generated embedding
    }
})) 

const results=await index.upsert({
    records: docs.map((doc, i) => ({
        id: `doc-${i}`, // Assign a unique ID to each document
        values: doc.embedding, // Store the embedding values
        metadata: { text: doc.text } // Store the chunk text as metadata
    }))
}) 

const query = "Once upon a time" // Define a query to search for in the vector database

const queryEmbedding = await embeddings.embedQuery(query) // Generate an embedding for the query
const queryResults = await index.query({
    vector: queryEmbedding, // Use the query embedding for the search
    topK: 3, // Retrieve the top 3 most similar documents
    includeMetadata: true // Include metadata in the results
})
console.log(JSON.stringify(queryResults)) // Log the query results to the console