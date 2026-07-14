import {Router} from 'express';
import { registerUser } from '../Controllers/auth.controller.js';
import {body, validationResult} from "express-validator";
import { registerValidationRules } from '../validation/auth.validate.js';

const AuthRoute=Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
AuthRoute.post("/register", registerValidationRules,registerUser);

export default AuthRoute;