import { Router } from "express";
import { authUser } from "../middlewire/auth.middlewire.js";
import { createProject, getProjects, deleteProject, reindexProject, getStorageQuota } from "../controller/project.controller.js";

const projectRoutes = Router();

projectRoutes.post("/", authUser, createProject);
projectRoutes.get("/", authUser, getProjects);
projectRoutes.get("/storage-quota", authUser, getStorageQuota);
projectRoutes.delete("/:projectId", authUser, deleteProject);
projectRoutes.post("/:projectId/reindex", authUser, reindexProject);

export default projectRoutes;