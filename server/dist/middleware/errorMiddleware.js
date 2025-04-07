"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
/**
 * Error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
    console.error('Error:', err);
    // Handle multer errors
    if (err.name === 'MulterError') {
        if (err.message === 'File too large') {
            res.status(400).json({ error: 'File size exceeds the 5MB limit' });
            return;
        }
        res.status(400).json({ error: err.message });
        return;
    }
    // Handle application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
        return;
    }
    // Handle unknown errors
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};
exports.errorMiddleware = errorMiddleware;
