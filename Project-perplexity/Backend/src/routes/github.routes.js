import { Router } from "express";
import { authUser } from "../middlewire/auth.middlewire.js";
import {
    startGithubOAuth,
    githubOAuthCallback,
    getGithubStatus,
    disconnectGithub,
    getRepos,
} from "../controller/github.controller.js";

const githubRoutes = Router();

githubRoutes.get("/oauth/start", authUser, startGithubOAuth);
githubRoutes.get("/oauth/callback", githubOAuthCallback); // no authUser — GitHub redirects here directly, no cookie/JWT in the request
githubRoutes.get("/status", authUser, getGithubStatus);
githubRoutes.delete("/disconnect", authUser, disconnectGithub);
githubRoutes.get("/repos", authUser, getRepos);

export default githubRoutes;