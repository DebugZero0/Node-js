import userModel from "../models/user.model.js";
import ChatModel from "../models/chat.model.js";
import MessageModel from "../models/message.model.js";

const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development";

function refreshCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 3 * 24 * 60 * 60 * 1000,
    };
}
function accessTokenOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 15 * 60 * 1000,
    };
}

export async function updateUserName(req, res) {
    
    const userId = req.user?.id || req.user?._id || req.userId;
    const { newName } = req.body;

    try{
        const user = await userModel.findOneAndUpdate({ _id: userId }, { username: newName }, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json({ message: "User name updated successfully" },user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function deleteUser(req, res) {
    const userId = req.user?.id || req.user?._id || req.userId;

    try {
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized user" });
        }
        await MessageModel.deleteMany({ userId });
        await ChatModel.deleteMany({ userId });
        await userModel.findByIdAndDelete(userId);

        res.clearCookie("refreshToken", refreshCookieOptions());
        res.clearCookie("accessToken", accessTokenOptions());

        res.status(200).json({ message: "User and associated chats/messages deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
}