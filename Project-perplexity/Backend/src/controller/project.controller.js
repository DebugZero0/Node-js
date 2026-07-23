import User from "../models/user.model.js";
import ProjectModel from "../models/project.model.js";
import { indexProject } from "../services/rag.service.js";
import { checkStorageQuota } from "../utils/storageLimiter.js";

export async function createProject(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { name, owner, repo, branch } = req.body;

    if (!owner || !repo) {
        return res.status(400).json({ error: "A repository selection is required" });
    }

    try {
        const user = await User.findById(userId).select("+githubAccessToken");
        if (!user?.githubAccessToken) {
            return res.status(400).json({ error: "Connect GitHub before adding a project" });
        }

        const quota = await checkStorageQuota(userId);
        if (!quota.allowed) {
            return res.status(429).json({ error: "Storage limit reached. Delete a project to free up space before adding a new one." });
        }

        const project = await ProjectModel.create({
            userId,
            name: name?.trim() || repo,
            githubUrl: `https://github.com/${owner}/${repo}`,
            owner,
            repo,
            branch: branch?.trim() || "",
            status: "indexing",
        });

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

export async function getStorageQuota(req, res) {
    const userId = req.user?.id || req.user?._id;
    try {
        if (!userId) return res.status(401).json({ error: "Unauthorized user" });
        const quota = await checkStorageQuota(userId);
        res.set("Cache-Control", "no-store");
        res.status(200).json(quota);
    } catch (error) {
        console.error("Error fetching storage quota:", error);
        res.status(500).json({ error: "Failed to fetch storage quota" });
    }
}