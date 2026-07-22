import { api } from "../../../app/api.client.js"

export async function createProject(payload) {
    const response = await api.post("/api/projects", payload)
    return response.data
}

export async function getProjects() {
    const response = await api.get("/api/projects")
    return response.data
}

export async function deleteProject(projectId) {
    const response = await api.delete(`/api/projects/${projectId}`)
    return response.data
}

export async function reindexProject(projectId) {
    const response = await api.post(`/api/projects/${projectId}/reindex`)
    return response.data
}