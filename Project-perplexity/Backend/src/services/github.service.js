import axios from "axios";

const TEXT_EXTENSIONS = new Set([
    ".js", ".jsx", ".ts", ".tsx", ".md", ".mdx", ".json", ".py", ".java",
    ".go", ".rb", ".css", ".scss", ".html", ".yml", ".yaml", ".txt", ".sql",
]);

const IGNORED_SEGMENTS = ["node_modules", "dist", "build", ".git", "package-lock.json", "yarn.lock", "coverage"];

function parseGithubUrl(url) {
    const match = url.trim().replace(/\/$/, "").match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match) throw new Error("That doesn't look like a valid GitHub repository URL");
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

function isIndexable(path) {
    if (IGNORED_SEGMENTS.some((seg) => path.includes(seg))) return false;
    const ext = path.slice(path.lastIndexOf("."));
    return TEXT_EXTENSIONS.has(ext);
}

export async function fetchRepoFiles(githubUrl, { branch, maxFiles = 60, maxFileSize = 60000 } = {}) {
    const { owner, repo } = parseGithubUrl(githubUrl);
    const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

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
            const { data: content } = await axios.get(
                `https://raw.githubusercontent.com/${owner}/${repo}/${resolvedBranch}/${item.path}`,
                { responseType: "text", transformResponse: (r) => r }
            );
            if (typeof content === "string" && content.trim().length > 0) {
                files.push({ path: item.path, content: content.slice(0, maxFileSize) });
            }
        } catch {
            // binary / too large / rate limited — skip silently
        }
    }

    return { owner, repo, branch: resolvedBranch, files };
}