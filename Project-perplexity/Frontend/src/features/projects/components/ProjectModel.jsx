import { useEffect, useRef, useState } from "react"
import { useProjects } from "../hooks/useProject"

const STATUS_STYLES = {
    indexing: "text-amber-300 bg-amber-400/10 border-amber-400/30",
    ready: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
    failed: "text-rose-300 bg-rose-400/10 border-rose-400/30",
}

function StatusBadge({ status }) {
    const label = status === "indexing" ? "Indexing..." : status === "failed" ? "Failed" : "Ready"
    return (
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status] || ""}`}>
            {label}
        </span>
    )
}

export default function ProjectModal({ open, onClose, selectedProjectId, onSelectProject }) {
    const { projects, loading, error, loadProjects, addProject, removeProject, reindex } = useProjects()
    const [name, setName] = useState("")
    const [githubUrl, setGithubUrl] = useState("")
    const [branch, setBranch] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState("")
    const pollRef = useRef(null)

    useEffect(() => {
        if (!open) return
        loadProjects()
    }, [open, loadProjects])

    useEffect(() => {
        if (!open) return
        const hasIndexing = projects.some((p) => p.status === "indexing")
        if (hasIndexing && !pollRef.current) {
            pollRef.current = setInterval(loadProjects, 3000)
        }
        if (!hasIndexing && pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
        return () => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
        }
    }, [open, projects, loadProjects])

    if (!open) return null

    async function handleSubmit(event) {
        event.preventDefault()
        if (!githubUrl.trim()) { setFormError("Paste a GitHub repository URL"); return }
        setSubmitting(true)
        setFormError("")
        try {
            const project = await addProject({ name, githubUrl, branch })
            setName(""); setGithubUrl(""); setBranch("")
            onSelectProject(project)
        } catch (err) {
            setFormError(err.response?.data?.error || "Failed to add project")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center sm:px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[min(94vw,32rem)] rounded-t-3xl border border-white/10 bg-[#0d0d0f] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:rounded-2xl sm:p-6 max-h-[88vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Project context</p>
                        <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">Add a GitHub project</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                    <input
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                    />
                    <div className="flex gap-2">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name (optional)"
                            className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                        />
                        <input
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="Branch (optional)"
                            className="w-40 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10"
                        />
                    </div>
                    {formError && <p className="text-sm text-rose-300">{formError}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    >
                        {submitting ? "Indexing repo..." : "Index repository"}
                    </button>
                </form>

                <div className="mt-6">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-zinc-600">Your projects</p>
                    {loading && projects.length === 0 ? (
                        <p className="text-sm text-zinc-500">Loading...</p>
                    ) : error ? (
                        <p className="text-sm text-rose-300">{error}</p>
                    ) : projects.length === 0 ? (
                        <p className="text-sm text-zinc-500">No projects yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {projects.map((project) => (
                                <li
                                    key={project._id}
                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                                        selectedProjectId === project._id
                                            ? "border-white/25 bg-white/[0.07]"
                                            : "border-white/[0.06] bg-white/[0.02]"
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">{project.name}</p>
                                        <p className="truncate text-xs text-zinc-500">{project.githubUrl}</p>
                                        {project.status === "failed" && project.error && (
                                            <p className="mt-1 text-xs text-rose-300">{project.error}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <StatusBadge status={project.status} />
                                        {project.status === "ready" && (
                                            <button
                                                type="button"
                                                onClick={() => { onSelectProject(project); onClose() }}
                                                className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/10"
                                            >
                                                {selectedProjectId === project._id ? "Selected" : "Use"}
                                            </button>
                                        )}
                                        {project.status === "failed" && (
                                            <button
                                                type="button"
                                                onClick={() => reindex(project._id)}
                                                className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/10"
                                            >
                                                Retry
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeProject(project._id)}
                                            className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}