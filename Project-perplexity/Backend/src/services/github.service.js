import axios from "axios";

const TEXT_EXTENSIONS = new Set([
    ".js", ".jsx", ".ts", ".tsx", ".md", ".mdx", ".json", ".py", ".java",
    ".go", ".rb", ".css", ".scss", ".html", ".yml", ".yaml", ".txt", ".sql",
    ".c", ".h", ".cpp", ".cc", ".cxx", ".hpp", ".hxx",
    ".rs", ".php", ".cs", ".sh", ".mk",
]);

const ALLOWED_FILENAMES = new Set(["Makefile", "makefile", "CMakeLists.txt", "README"]);
const IGNORED_SEGMENTS = ["node_modules", "dist", "build", ".git", "package-lock.json", "yarn.lock", "coverage"];

function isIndexable(path) {
    if (IGNORED_SEGMENTS.some((seg) => path.includes(seg))) return false;

    const fileName = path.slice(path.lastIndexOf("/") + 1);
    if (ALLOWED_FILENAMES.has(fileName)) return true;

    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex <= 0) return false;

    return TEXT_EXTENSIONS.has(fileName.slice(dotIndex));
}

function authHeaders(accessToken) {
    return accessToken
        ? { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" }
        : { Accept: "application/vnd.github+json" };
}

/**
 * Lists repos the authenticated GitHub user has access to (their own + orgs, public + private).
 * Supports simple pagination via `page`.
 */
export async function listUserRepos(accessToken, { page = 1, perPage = 30, search = "" } = {}) {
    const headers = authHeaders(accessToken);

    if (search.trim()) {
        // GitHub search API for repo names when the user is filtering
        const { data } = await axios.get("https://api.github.com/search/repositories", {
            headers,
            params: { q: `${search} user:@me`, per_page: perPage, page },
        });
        return {
            repos: data.items.map(mapRepo),
            hasMore: data.items.length === perPage,
        };
    }

    const { data } = await axios.get("https://api.github.com/user/repos", {
        headers,
        params: { per_page: perPage, page, sort: "updated", affiliation: "owner,collaborator,organization_member" },
    });

    return {
        repos: data.map(mapRepo),
        hasMore: data.length === perPage,
    };
}

function mapRepo(repo) {
    return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner?.login,
        private: repo.private,
        description: repo.description,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        htmlUrl: repo.html_url,
    };
}

export async function fetchRepoFiles(owner, repo, { accessToken, branch, maxFiles = 60, maxFileSize = 60000 } = {}) {
    const headers = authHeaders(accessToken);

    let resolvedBranch = branch;
    if (!resolvedBranch) {
        const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        resolvedBranch = data.default_branch || "main";
    }

    const { data: treeData } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${resolvedBranch}?recursive=1`,
        { headers }
    );
    if (!treeData.tree) throw new Error("Could not read the repository file tree");

    const candidates = treeData.tree.filter((item) => item.type === "blob" && isIndexable(item.path)).slice(0, maxFiles);

    const files = [];
    for (const item of candidates) {
        try {
            // Use the contents API (works for private repos with a token) instead of raw.githubusercontent.com,
            // which cannot authenticate private repo requests.
            const { data: fileData } = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(item.path)}`,
                { headers, params: { ref: resolvedBranch } }
            );

            if (fileData?.content && fileData.encoding === "base64") {
                const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
                if (decoded.trim().length > 0) {
                    files.push({ path: item.path, content: decoded.slice(0, maxFileSize) });
                }
            }
        } catch {
            // binary / too large / rate limited — skip silently
        }
    }

    return { owner, repo, branch: resolvedBranch, files };
}