import { useEffect, useState, useCallback } from "react"
import { getGithubOAuthUrl, getGithubStatus, disconnectGithub, getRepos } from "../service/github.api"
import { useAuth } from "../../auth/hooks/useAuth"

export default function GithubRepoPicker({ onSelectRepo }) {
    const { handleRefresh } = useAuth()
    const [status, setStatus] = useState({ connected: false, username: null })
    const [statusLoading, setStatusLoading] = useState(true)
    const [repos, setRepos] = useState([])
    const [reposLoading, setReposLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState("")
    const [connecting, setConnecting] = useState(false)

    const loadStatus = useCallback(async () => {
        setStatusLoading(true)
        try {
            const data = await getGithubStatus()
            setStatus(data)
        } catch {
            setStatus({ connected: false, username: null })
        } finally {
            setStatusLoading(false)
        }
    }, [])

    useEffect(() => { loadStatus() }, [loadStatus])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("github") === "connected" || params.get("github") === "error") {
            loadStatus()
            const url = new URL(window.location.href)
            url.searchParams.delete("github")
            window.history.replaceState({}, "", url.toString())
        }
    }, [loadStatus])

    const loadRepos = useCallback(async (pageNum, searchTerm) => {
        setReposLoading(true)
        setError("")
        try {
            const data = await getRepos({ page: pageNum, perPage: 20, search: searchTerm })
            setRepos((current) => (pageNum === 1 ? data.repos : [...current, ...data.repos]))
            setHasMore(data.hasMore)
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load repositories")
        } finally {
            setReposLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!status.connected) return
        setPage(1)
        loadRepos(1, search)
    }, [status.connected, search, loadRepos])

    async function handleDisconnect() {
        await disconnectGithub()
        setStatus({ connected: false, username: null })
        setRepos([])
    }

    // Ensures a valid accessToken cookie exists before navigating to GitHub's
    // OAuth screen — the access token is short-lived (15 min), but the refresh
    // token (3 days) is almost certainly still valid, so we silently refresh first.
    async function handleConnectClick() {
        setConnecting(true)
        setError("")
        try {
            await handleRefresh()
            window.location.href = getGithubOAuthUrl()
        } catch (err) {
            setConnecting(false)
            setError("Your session expired. Please log in again before connecting GitHub.")
        }
    }

    if (statusLoading) {
        return <p className="text-sm text-zinc-500">Checking GitHub connection...</p>
    }

    if (!status.connected) {
        return (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center">
                <p className="text-sm text-zinc-400">
                    Connect your GitHub account to browse and select a repository for project context.
                </p>
                {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                <button
                    type="button"
                    onClick={handleConnectClick}
                    disabled={connecting}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                    </svg>
                    {connecting ? "Connecting..." : "Connect GitHub"}
                </button>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                    Connected as <span className="text-zinc-300">@{status.username}</span>
                </p>
                <button type="button" onClick={handleDisconnect} className="text-xs text-rose-300 hover:underline">
                    Disconnect
                </button>
            </div>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your repositories..."
                className="mb-3 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/25 focus:ring-2 focus:ring-white/10"
            />

            {error && <p className="mb-2 text-sm text-rose-300">{error}</p>}

            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                {repos.length === 0 && !reposLoading ? (
                    <p className="text-sm text-zinc-500">No repositories found.</p>
                ) : (
                    repos.map((repo) => (
                        <button
                            key={repo.id}
                            type="button"
                            onClick={() => onSelectRepo(repo)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{repo.fullName}</p>
                                {repo.description && (
                                    <p className="truncate text-xs text-zinc-500">{repo.description}</p>
                                )}
                            </div>
                            {repo.private && (
                                <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                                    Private
                                </span>
                            )}
                        </button>
                    ))
                )}
            </div>

            {hasMore && (
                <button
                    type="button"
                    onClick={() => { const next = page + 1; setPage(next); loadRepos(next, search) }}
                    disabled={reposLoading}
                    className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/[0.05] disabled:opacity-50"
                >
                    {reposLoading ? "Loading..." : "Load more"}
                </button>
            )}
        </div>
    )
}