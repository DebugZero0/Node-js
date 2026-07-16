import userModel from "../models/user.model.js";

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

