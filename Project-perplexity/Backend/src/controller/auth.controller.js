import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
import dotenv from "dotenv";
dotenv.config();

const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

function buildAccessToken(user) {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function buildRefreshToken(user) {
    return jwt.sign({ id: user._id, email: user.email }, refreshTokenSecret, { expiresIn: "3d" });
}

function refreshCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 3 * 24 * 60 * 60 * 1000,
    };
}

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if the email or username is already registered
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                message: "Email or username is already registered",
                success: false,
                err: "User already exists"
            });
        }
        // Create a new user
        const newUser = new User({ username, email, password });
        await newUser.save();
        // Generate a JWT token
        const emailVerificationToken = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
        // Send a welcome email
        await sendEmail(
            newUser.email,
            "Welcome to Perplexity",
            `<h1>Welcome ${newUser.username}</h1>
                <p>Thank you for registering at Perplexity. We're excited to have you on board!</p>
                <p>To get started, please verify your email address by clicking the link below:</p>
                <a href="${backendUrl}/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br/>The Perplexity Team</p>`
        );
        // res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email } });
        res.status(201).json({
            message: "User registered successfully. Please check your email for a welcome message.",
            success: true,
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password", success: false });
        }
        if (!user.verified) {
            return res.status(400).json({ message: "Email not verified. Please check your email for the verification link.", success: false });
        }
        const accessToken = buildAccessToken(user);
        const refreshToken = buildRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            maxAge: 15 * 60 * 1000, // 15 min
        });

        res.cookie("refreshToken", refreshToken, refreshCookieOptions());
        res.status(200).json({ accessToken, user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided", success: false });
    }

    try {
        const decoded = jwt.verify(refreshToken, refreshTokenSecret);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token", success: false });
        }

        const accessToken = buildAccessToken(user);

        return res.status(200).json({
            accessToken,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Invalid or expired refresh token", success: false });
    }
};

export const verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(400).json({ message: "Invalid token", success: false });
        }
        user.verified = true;
        await user.save();

        const html = `<html style="margin:0;padding:0;height:100%;width:100%;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#fafafa;">
        <div style="margin:0;padding:0;height:100%;width:100%;background:#09090b;font-family:Arial,Helvetica,sans-serif;color:#fafafa;">
                <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
                    <div style="border:1px solid rgba(49,184,198,0.35);border-radius:24px;padding:40px 28px;background:rgba(9,9,11,0.82);box-shadow:0 0 45px -12px rgba(49,184,198,0.45);backdrop-filter:blur(10px);text-align:center;">
                        <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(49,184,198,0.15);color:#67e8f9;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
                            Verified
                        </div>
                        <h1 style="margin:24px 0 12px;font-size:32px;line-height:1.15;color:#67e8f9;">Email Verified</h1>
                        <p style="margin:0 auto 28px;max-width:480px;font-size:16px;line-height:1.7;color:#d4d4d8;">
                            Your email has been successfully verified. You can now sign in and continue where you left off.
                        </p>
                        <a href="${frontendUrl}/login" style="display:inline-block;padding:14px 22px;border-radius:14px;background:linear-gradient(90deg,#31b8c6 0%,#06b6d4 55%,#67e8f9 100%);color:#09090b;text-decoration:none;font-size:15px;font-weight:700;">
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
            </html>`;
        res.status(200).send(html);
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(400).json({ message: "Invalid or expired token", success: false });
    }
};

export const getMe = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};

export const logOut = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        // Clear the refresh token and access token from the user document and clear the cookie
        user.refreshToken = null;
        user.accessToken = null;
        
        await user.save();
        res.clearCookie("refreshToken", refreshCookieOptions());
        res.clearCookie("accessToken", accessTokenOptions());
        
        res.status(200).json({ message: "Logged out successfully", success: true });
    } catch (error) {
        console.error("Error logging out user:", error);
        res.status(500).json({ message: "Server error", success: false });
    }
};