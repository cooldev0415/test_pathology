"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dataService_1 = require("./services/dataService");
const analysisService_1 = require("./services/analysisService");
const oruParser_1 = require("./services/oruParser");
const analyzeController_1 = require("./controllers/analyzeController");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const analyzeRoutes_1 = require("./routes/analyzeRoutes");
const config_1 = require("./config");
// Initialize services
const dataService = new dataService_1.DataService(config_1.config.data.directory);
const oruParser = new oruParser_1.ORUParser(dataService);
const analysisService = new analysisService_1.AnalysisService(dataService);
// Initialize controller
const analyzeController = new analyzeController_1.AnalyzeController(analysisService, oruParser);
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', (0, analyzeRoutes_1.setupAnalyzeRoutes)(analyzeController, dataService));
// Error handling
app.use(errorMiddleware_1.errorMiddleware);
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Load reference data
        yield dataService.loadData();
        console.log('Reference data loaded successfully');
        // Start listening
        app.listen(config_1.config.server.port, () => {
            console.log(`Server is running on port ${config_1.config.server.port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
