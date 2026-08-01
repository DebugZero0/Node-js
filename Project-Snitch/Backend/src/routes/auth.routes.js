import { Router } from "express";
import {registerValidation, loginValidation} from "../validator/auth.validator.js";
import { register, login } from "../controllers/auth.controller.js";
import passport from "passport";
import { googleCallback } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), googleCallback);

export default router;