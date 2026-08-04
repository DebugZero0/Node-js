import { body, validationResult } from "express-validator";

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const createProductValidator = [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('priceAmount').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('priceCurrency').isIn(['USD', 'EUR', 'GBP', 'INR']).withMessage('Currency must be one of USD, EUR, GBP, or INR'),
    validateRequest
];