import { useState, useCallback } from "react"
import {
    createProject as createProjectRequest,
    getProjects as getProjectsRequest,
    deleteProject as deleteProjectRequest,
    reindexProject as reindexProjectRequest,
} from "../service/project.api"

export function useProjects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const loadProjects = useCallback(async () => {
        setLoading(true)
        setError("")
        try {
            const data = await getProjectsRequest()
            setProjects(data.projects || [])
            return data.projects
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load projects")
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    async function addProject({ name, owner, repo, branch }) {
        const data = await createProjectRequest({ name, owner, repo, branch })
        setProjects((current) => [data.project, ...current])
        return data.project
    }

    async function removeProject(projectId) {
        await deleteProjectRequest(projectId)
        setProjects((current) => current.filter((p) => p._id !== projectId))
    }

    async function reindex(projectId) {
        await reindexProjectRequest(projectId)
        setProjects((current) =>
            current.map((p) => (p._id === projectId ? { ...p, status: "indexing" } : p))
        )
    }

    return { projects, loading, error, loadProjects, addProject, removeProject, reindex }
}