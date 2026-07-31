import { Router } from "express";
import {registerValidation, loginValidation} from "../validator/auth.validator.js";
import { register } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidation, register);


export default router;