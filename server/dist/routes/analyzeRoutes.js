"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAnalyzeRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const dataMiddleware_1 = require("../middleware/dataMiddleware");
// Configure multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only text files
        if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
            cb(null, true);
        }
        else {
            cb(new Error('Only text files are allowed'));
        }
    }
});
/**
 * Setup routes for ORU analysis
 */
const setupAnalyzeRoutes = (controller, dataService) => {
    const router = (0, express_1.Router)();
    // Analyze ORU file endpoint
    router.post('/analyze-oru', (0, dataMiddleware_1.checkDataLoaded)(dataService), upload.single('oruFile'), (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        next();
    }, controller.analyzeORU);
    return router;
};
exports.setupAnalyzeRoutes = setupAnalyzeRoutes;
