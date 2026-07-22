import ProjectModel from "../models/project.model.js";
import { indexProject } from "../services/rag.service.js";

export async function createProject(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { name, githubUrl, branch } = req.body;

    if (!githubUrl || !githubUrl.trim()) {
        return res.status(400).json({ error: "GitHub URL is required" });
    }

    try {
        const project = await ProjectModel.create({
            userId,
            name: name?.trim() || githubUrl.split("/").filter(Boolean).slice(-1)[0],
            githubUrl: githubUrl.trim(),
            branch: branch?.trim() || "",
            status: "indexing",
        });

        // Fire-and-forget so the request doesn't hang on a large repo
        indexProject(project._id).catch((err) => console.error("Project indexing failed:", err.message));

        res.status(201).json({ project });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Failed to create project" });
    }
}

export async function getProjects(req, res) {
    const userId = req.user?.id || req.user?._id;
    try {
        const projects = await ProjectModel.find({ userId }).select("-chunks").sort({ createdAt: -1 });
        res.status(200).json({ projects });
    } catch {
        res.status(500).json({ error: "Failed to fetch projects" });
    }
}

export async function deleteProject(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { projectId } = req.params;
    try {
        const project = await ProjectModel.findOneAndDelete({ _id: projectId, userId });
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.status(200).json({ message: "Project deleted" });
    } catch {
        res.status(500).json({ error: "Failed to delete project" });
    }
}

export async function reindexProject(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { projectId } = req.params;
    try {
        const project = await ProjectModel.findOne({ _id: projectId, userId });
        if (!project) return res.status(404).json({ error: "Project not found" });
        project.status = "indexing";
        await project.save();
        indexProject(project._id).catch((err) => console.error("Reindex failed:", err.message));
        res.status(200).json({ message: "Reindexing started" });
    } catch {
        res.status(500).json({ error: "Failed to reindex project" });
    }
}