"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
/**
 * Application configuration
 */
exports.config = {
    server: {
        port: process.env.PORT || 5000
    },
    data: {
        directory: path_1.default.join(__dirname, '..', 'data')
    }
};
