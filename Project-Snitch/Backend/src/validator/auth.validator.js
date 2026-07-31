import {body,validationResult} from "express-validator"

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("contact").isMobilePhone().withMessage("Please provide a valid phone number"),
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("isSeller").isBoolean().withMessage("isSeller must be a boolean value"),
  validateRequest
];

export const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest
];
