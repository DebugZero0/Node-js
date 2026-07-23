import { api } from "../../../app/api.client.js"

export function getGithubOAuthUrl() {
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/github/oauth/start`
}

export async function getGithubStatus() {
    const response = await api.get("/api/github/status")
    return response.data
}

export async function disconnectGithub() {
    const response = await api.delete("/api/github/disconnect")
    return response.data
}

export async function getRepos({ page = 1, perPage = 30, search = "" } = {}) {
    const response = await api.get("/api/github/repos", { params: { page, perPage, search } })
    return response.data
}