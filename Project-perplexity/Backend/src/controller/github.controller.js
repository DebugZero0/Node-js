import axios from "axios";
import qs from "querystring";
import User from "../models/user.model.js";
import { listUserRepos } from "../services/github.service.js";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_OAUTH_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Step 1: redirect the user to GitHub's consent screen.
// `state` carries the logged-in user's id through the OAuth round trip since
// GitHub's callback isn't authenticated with our own cookies/JWT.
export function startGithubOAuth(req, res) {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized user" });

    const params = qs.stringify({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "repo read:user",
        state: userId.toString(),
        allow_signup: "true",
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

// Step 2: GitHub redirects here with a `code`. Exchange it for an access token,
// then send the user back to the frontend.
export async function githubOAuthCallback(req, res) {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/?github=error`);
    }

    try {
        const { data } = await axios.post(
            "https://github.com/login/oauth/access_token",
            { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: REDIRECT_URI },
            { headers: { Accept: "application/json" } }
        );

        if (!data.access_token) {
            return res.redirect(`${FRONTEND_URL}/?github=error`);
        }

        const { data: githubUser } = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });

        await User.findByIdAndUpdate(state, {
            githubAccessToken: data.access_token,
            githubUsername: githubUser.login,
            githubConnectedAt: new Date(),
        });

        res.redirect(`${FRONTEND_URL}/?github=connected`);
    } catch (error) {
        console.error("GitHub OAuth callback failed:", error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/?github=error`);
    }
}

export async function getGithubStatus(req, res) {
    const userId = req.user?.id || req.user?._id;
    try {
        const user = await User.findById(userId).select("githubUsername githubConnectedAt");
        res.status(200).json({
            connected: Boolean(user?.githubUsername),
            username: user?.githubUsername || null,
            connectedAt: user?.githubConnectedAt || null,
        });
    } catch {
        res.status(500).json({ error: "Failed to fetch GitHub status" });
    }
}

export async function disconnectGithub(req, res) {
    const userId = req.user?.id || req.user?._id;
    try {
        await User.findByIdAndUpdate(userId, {
            githubAccessToken: null,
            githubUsername: null,
            githubConnectedAt: null,
        });
        res.status(200).json({ message: "GitHub disconnected" });
    } catch {
        res.status(500).json({ error: "Failed to disconnect GitHub" });
    }
}

export async function getRepos(req, res) {
    const userId = req.user?.id || req.user?._id;
    const { page = 1, perPage = 30, search = "" } = req.query;

    try {
        const user = await User.findById(userId).select("+githubAccessToken githubUsername");
        if (!user?.githubAccessToken) {
            return res.status(400).json({ error: "GitHub is not connected" });
        }

        const result = await listUserRepos(user.githubAccessToken, {
            page: Number(page),
            perPage: Number(perPage),
            search: String(search),
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error listing GitHub repos:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch repositories" });
    }
}