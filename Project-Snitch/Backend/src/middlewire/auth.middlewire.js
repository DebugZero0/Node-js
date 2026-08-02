import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import userModel from "../models/user.model.js";

export const authenticateSeller = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if(user.role !== 'seller'){
            return res.status(403).json({ message: "Forbidden: Only sellers can access this resource" });
        }
        req.user = user;
        next();
    } 
    catch (error) {
        return res.status(401).json({ message: "Unauthorized", error: error.message });
    }
};