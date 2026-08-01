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

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie("token",token)
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

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        await SendTokenResponse(user,res,"login successful",200);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const googleCallback = async (req, res) => {

    const {id,emails,displayName,photos} = req.user;
    const email = emails[0].value;
    const profilePicture = photos[0].value;
    const user=await userModel.findOne({email});

    if(!user){
        const newUser = await userModel.create({
            email,
            googleId: id,
            fullName: displayName
        });
    }
    const token= jwt.sign({id: user._id,},config.JWT_SECRET,{expiresIn:'7d'});
    res.cookie("token",token);

    res.redirect("http://localhost:5173/");
};
