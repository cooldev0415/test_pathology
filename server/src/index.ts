import express from 'express';
import cors from 'cors';
import path from 'path';
import { DataService } from './services/dataService';
import { AnalysisService } from './services/analysisService';
import { ORUParser } from './services/oruParser';
import { AnalyzeController } from './controllers/analyzeController';
import { errorMiddleware } from './middleware/errorMiddleware';
import { checkDataLoaded } from './middleware/dataMiddleware';
import { setupAnalyzeRoutes } from './routes/analyzeRoutes';
import { config } from './config';

// Initialize services
const dataService = new DataService(config.data.directory);
const oruParser = new ORUParser(dataService);
const analysisService = new AnalysisService(dataService);

// Initialize controller
const analyzeController = new AnalyzeController(analysisService, oruParser);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', setupAnalyzeRoutes(analyzeController, dataService));

// Error handling
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    // Load reference data
    await dataService.loadData();
    console.log('Reference data loaded successfully');

    // Start listening
    app.listen(config.server.port, () => {
      console.log(`Server is running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 