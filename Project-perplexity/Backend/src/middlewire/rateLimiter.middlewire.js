import { consumeMessageQuota } from "../utils/rateLimiter.js";

export const enforceMessageQuota = async (req, res, next) => {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized user", success: false });
    }

    try {
        const result = await consumeMessageQuota(userId);
        if (!result.allowed) {
            return res.status(429).json({ message: result.message, success: false });
        }
        next();
    } catch (error) {
        console.error("Rate limiter error:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};