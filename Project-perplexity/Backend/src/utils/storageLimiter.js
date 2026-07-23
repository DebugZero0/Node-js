import mongoose from "mongoose";
import ProjectModel from "../models/project.model.js";
import User from "../models/user.model.js";

export function getDefaultStorageLimit() {
    return Number(process.env.STORAGE_LIMIT_BYTES) || 50 * 1024 * 1024; // 50MB
}

// Sums the actual stored size (chunk text + file paths + embedding vectors)
// across every project the user owns, via aggregation so we never have to
// pull all chunk data into memory.
export async function getStorageUsage(userId) {
    const result = await ProjectModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $project: { chunks: { $ifNull: ["$chunks", []] } } },
        { $unwind: { path: "$chunks", preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                totalBytes: {
                    $sum: {
                        $add: [
                            { $strLenBytes: { $ifNull: ["$chunks.content", ""] } },
                            { $strLenBytes: { $ifNull: ["$chunks.filePath", ""] } },
                            // embeddings are arrays of floats (8 bytes each)
                            { $multiply: [{ $size: { $ifNull: ["$chunks.embedding", []] } }, 8] },
                        ],
                    },
                },
            },
        },
    ]);

    return result[0]?.totalBytes || 0;
}

export async function checkStorageQuota(userId) {
    const user = await User.findById(userId).select("storageLimit");
    const limit = user?.storageLimit ?? getDefaultStorageLimit();
    const used = await getStorageUsage(userId);
    const percentage = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

    return {
        used,
        limit,
        remaining: Math.max(limit - used, 0),
        percentage,
        allowed: used < limit,
    };
}