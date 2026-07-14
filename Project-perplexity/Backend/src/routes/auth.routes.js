import { Router } from "express";
import { body } from "express-validator";
import { registerValidator,loginValidator } from "../validation/auth.validation.js";
import { verifyEmail,register,login,refresh,getMe,logOut } from "../controller/auth.controller.js";
import { authUser } from "../middlewire/auth.middlewire.js";


const authRouts = Router();

authRouts.post("/register", registerValidator, register);
authRouts.post("/login", loginValidator, login);
authRouts.post("/refresh", refresh);
authRouts.get("/get-me",authUser,getMe);
authRouts.post("/logout",authUser, logOut);

authRouts.get("/verify-email", verifyEmail);



export default authRouts;