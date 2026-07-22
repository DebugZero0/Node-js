import ProjectModel from "../models/project.model.js";
import { fetchRepoFiles } from "./github.service.js";
import { embedTexts, cosineSimilarity } from "./embedding.service.js";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MAX_CHUNKS = 250;

function chunkText(text) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        chunks.push(text.slice(start, end));
        if (end === text.length) break;
        start = end - CHUNK_OVERLAP;
    }
    return chunks;
}

export async function indexProject(projectId) {
    const project = await ProjectModel.findById(projectId);
    if (!project) throw new Error("Project not found");

    try {
        const { files } = await fetchRepoFiles(project.githubUrl, { branch: project.branch || undefined });
        if (files.length === 0) throw new Error("No indexable text files found in this repository");

        const rawChunks = [];
        outer: for (const file of files) {
            for (const piece of chunkText(file.content)) {
                if (rawChunks.length >= MAX_CHUNKS) break outer;
                rawChunks.push({ filePath: file.path, content: piece });
            }
        }

        const embeddings = await embedTexts(rawChunks.map((c) => `File: ${c.filePath}\n\n${c.content}`));

        project.chunks = rawChunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
        project.fileCount = files.length;
        project.chunkCount = project.chunks.length;
        project.status = "ready";
        project.error = "";
        await project.save();
        return project;
    } catch (error) {
        project.status = "failed";
        project.error = error.message;
        await project.save();
        throw error;
    }
}

export async function retrieveContext(projectId, query, topK = 5) {
    const project = await ProjectModel.findById(projectId);
    if (!project || project.status !== "ready" || project.chunks.length === 0) return "";

    const [queryEmbedding] = await embedTexts([query]);

    const scored = project.chunks
        .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return scored.map(({ chunk }) => `File: ${chunk.filePath}\n${chunk.content}`).join("\n\n---\n\n");
}