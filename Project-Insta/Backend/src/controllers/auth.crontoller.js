const UserModel = require("../model/user.model");
const bcrypyt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");


async function registerController(req, res) {
    try {
        const { username, email, password , bio, profileImage } = req.body;

        // Check if the user already exists
        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] }); // or operator takes input as an array of objects and checks if any of the condition is true
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" + (existingUser.username === username ? " with this username" : " with this email") });
        }
        // Hash the password
        const hash = await bcrypyt.hash(password, 10);
        // Create a new user
        const user = await UserModel.create({ username, email, password:hash , bio, profileImage });
        
        // Generate JWT token
        const token = jwt.sign({ id: user._id , username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Set the token in a cookie
        res.cookie('token', token);
        
        res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profileImage: user.profileImage
            }
        });



    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function loginController(req, res) {
    try {
        const { username, email, password } = req.body;
        // Find the user by username or email
        const user = await UserModel.findOne({ 
            $or: [{ username:username }, { email:email }] 
        }).select('+password'); // Select the password field explicitly(forced) since it's excluded by default in the schema

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Compare the password
        const isMatch = await bcrypyt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jwt.sign({ id: user._id , username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Set the token in a cookie
        res.cookie('token', token);
        res.status(200).json({ 
            message: "User logged in successfully",
            user: {
                email: user.email,
                username: user.username,
                id: user._id
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function logoutController(req, res) {
    try {
        // Clear the token cookie
        res.clearCookie('token');
        
        res.status(200).json({ message: "User logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function getMeController(req, res) {
    const userId=req.user.id;
    const user=await UserModel.findById(userId);
    if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });

}

module.exports = { registerController, loginController, logoutController, getMeController }; 