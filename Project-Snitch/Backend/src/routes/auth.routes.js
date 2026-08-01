import { Router } from "express";
import {registerValidation, loginValidation} from "../validator/auth.validator.js";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);


export default router;