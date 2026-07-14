import jwt from "jsonwebtoken";

export const authUser = (req, res, next) => {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;

    const token = bearerToken || req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({
            message: "Access token required",
            success: false,
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired access token",
            success: false,
        });
    }
};