import { useEffect, useRef, useState } from "react"
import { useProjects } from "../hooks/useProject.js"
import GithubRepoPicker from "./GithubRepoPicker"

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

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 MB"
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`
}

function StorageQuotaBar({ quota }) {
    if (!quota) return null
    const pct = Math.min(100, quota.percentage ?? 0)
    const barColor =
        pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-[#31b8c6]"

    return (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Project storage used</span>
                <span className={pct >= 100 ? "font-semibold text-rose-300" : "font-medium text-zinc-300"}>
                    {pct}%
                </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{formatBytes(quota.used)} used</span>
                <span>{formatBytes(quota.limit)} limit</span>
            </div>
            {pct >= 100 && (
                <p className="mt-2 text-[11px] text-rose-300">
                    Storage limit reached — delete a project to add a new one.
                </p>
            )}
        </div>
    )
}

export default function ProjectModal({ open, onClose, selectedProjectId, onSelectProject }) {
    const {
        projects,
        loading,
        error,
        loadProjects,
        addProject,
        removeProject,
        reindex,
        storageQuota,
        loadStorageQuota,
    } = useProjects()
    const [pickerOpen, setPickerOpen] = useState(false)
    const [addingRepo, setAddingRepo] = useState(null)
    const [addError, setAddError] = useState("")
    const pollRef = useRef(null)

    useEffect(() => {
        if (!open) return
        loadProjects()
        loadStorageQuota()
    }, [open, loadProjects, loadStorageQuota])

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

    const storageFull = storageQuota ? storageQuota.percentage >= 100 : false

    async function handleSelectRepo(repo) {
        setAddingRepo(repo.id)
        setAddError("")
        try {
            const project = await addProject({
                name: repo.name,
                owner: repo.owner,
                repo: repo.name,
                branch: repo.defaultBranch,
            })
            setPickerOpen(false)
            onSelectProject(project)
        } catch (err) {
            setAddError(err.response?.data?.error || "Failed to add project")
        } finally {
            setAddingRepo(null)
        }
    }

    async function handleRemoveProject(projectId) {
        await removeProject(projectId)
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center sm:px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[min(94vw,32rem)] rounded-t-3xl border border-white/10 bg-[#0d0d0f] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:rounded-2xl sm:p-6 max-h-[88vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-600">Project context</p>
                        <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                            {pickerOpen ? "Choose a repository" : "Your projects"}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {pickerOpen ? (
                    <div className="mt-5">
                        {addError && <p className="mb-2 text-sm text-rose-300">{addError}</p>}
                        <GithubRepoPicker onSelectRepo={handleSelectRepo} />
                        <StorageQuotaBar quota={storageQuota} />
                        <button
                            type="button"
                            onClick={() => setPickerOpen(false)}
                            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300"
                        >
                            ← Back to your projects
                        </button>
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            disabled={storageFull}
                            className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {storageFull ? "Storage limit reached" : "+ Add project from GitHub"}
                        </button>

                        <StorageQuotaBar quota={storageQuota} />

                        <div className="mt-6">
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
                                                    onClick={() => handleRemoveProject(project._id)}
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
                    </>
                )}
            </div>
        </div>
    )
}