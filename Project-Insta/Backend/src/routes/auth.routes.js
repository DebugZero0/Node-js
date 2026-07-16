const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/auth.crontoller");
const identifyUser = require("../middlewire/auth.middlewire");

// POST /api/auth/register
authRouter.post("/register", authController.registerController);

// POST /api/auth/login
authRouter.post("/login", authController.loginController);

// POST /api/auth/logout
authRouter.post("/logout", authController.logoutController);

// POST /api/auth/get-me
authRouter.post("/get-me", identifyUser, authController.getMeController);

module.exports = authRouter;