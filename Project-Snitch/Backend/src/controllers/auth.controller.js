import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {config} from "../config/config.js";

async function SendTokenResponse(user,res,message,status) {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };

    res.cookie("token",token)

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
    res.send({
        token,
        user: {
            id: user._id,
            email: user.email, 
            contact: user.contact,
            fullName: user.fullName,
            role: user.role
        }
    });
}

export const register = async (req, res) => {
    const { email, password, contact, fullName, isSeller } = req.body;
    try {
        // Check if the user already exists
        const existingUser = await userModel.findOne({
            $or: [{ email }, { contact }]
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const newUser = await userModel.create({ email, password, contact, fullName, role: isSeller ? "seller" : "buyer" });
        await SendTokenResponse(newUser,res,"user registered successfully",201);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
