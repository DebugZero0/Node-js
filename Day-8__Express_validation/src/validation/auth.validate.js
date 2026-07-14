import {body, validationResult } from "express-validator";

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const registerValidationRules = [
        body("username").isString().withMessage("Username must have letters"),
        body("email").isEmail().withMessage("Please provide a valid email"),
        body("password").custom((value) => {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(value)) {
                throw new Error("Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.");
            }
            return true;
        }),
        validate
    ]
