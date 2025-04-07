"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDataLoaded = void 0;
const AppError_1 = require("../utils/AppError");
/**
 * Middleware to check if data is loaded before processing requests
 */
const checkDataLoaded = (dataService) => {
    return (req, res, next) => {
        if (!dataService.isDataLoaded()) {
            return next(new AppError_1.AppError('Data is not loaded yet. Please try again in a moment.', 503));
        }
        next();
    };
};
exports.checkDataLoaded = checkDataLoaded;
