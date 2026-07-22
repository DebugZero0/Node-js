import User from "../models/user.model.js";

export function isRateLimitEnabled() {
    return process.env.RATE_LIMIT_ENABLED !== undefined
        ? process.env.RATE_LIMIT_ENABLED === "true"
        : process.env.NODE_ENV === "production";
}

export function getDefaultMessageLimit() {
    return Number(process.env.MESSAGE_LIMIT) || 20;
}

const LIMIT_MESSAGE =
    "You've reached your request limit. Please contact the developer to increase your limits.";

export async function consumeMessageQuota(userId) {
    if (!isRateLimitEnabled()) {
        return { allowed: true };
    }

    const defaultLimit = getDefaultMessageLimit();

    const user = await User.findOneAndUpdate(
        {
            _id: userId,
            $expr: {
                $lt: [
                    { $ifNull: ["$messageCount", 0] },
                    { $ifNull: ["$messageLimit", defaultLimit] },
                ],
            },
        },
        { $inc: { messageCount: 1 } },
        { new: true }
    );

    if (!user) {
        return { allowed: false, message: LIMIT_MESSAGE };
    }

    return {
        allowed: true,
        remaining: (user.messageLimit ?? defaultLimit) - user.messageCount,
    };
}