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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeController = void 0;
const errorMiddleware_1 = require("../middleware/errorMiddleware");
/**
 * Controller for handling analysis requests
 */
class AnalyzeController {
    constructor(analysisService, oruParser) {
        /**
         * Analyze an ORU file
         */
        this.analyzeORU = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.file) {
                    throw new errorMiddleware_1.AppError('No file uploaded', 400);
                }
                console.log('File received:', {
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                });
                // Parse the ORU content
                const oruContent = req.file.buffer.toString('utf8');
                // Log file content preview (first 5 lines)
                console.log('File content preview:');
                const previewLines = oruContent.split(/\r?\n/).slice(0, 5);
                previewLines.forEach((line, i) => {
                    console.log(`Line ${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
                });
                let oruData;
                try {
                    console.log('Parsing ORU content...');
                    oruData = this.oruParser.parseORU(oruContent);
                    console.log('Parsed ORU data:', JSON.stringify(oruData, null, 2));
                }
                catch (parseError) {
                    console.error('Error parsing ORU file:', parseError);
                    throw new errorMiddleware_1.AppError(`Error parsing ORU file: ${parseError.message}`, 400);
                }
                // Analyze the ORU data
                console.log('Analyzing ORU data...');
                const analysisResult = this.analysisService.analyzeORUData(oruData);
                // Log analysis summary
                console.log('Analysis summary:');
                console.log(`- Patient: ${analysisResult.patientInfo.name}`);
                console.log(`- Doctor: ${analysisResult.doctorInfo.name}`);
                console.log(`- Abnormal results: ${analysisResult.abnormalResults.length}`);
                analysisResult.abnormalResults.forEach(result => {
                    console.log(`  - ${result.testName}: ${result.value} ${result.units} (${result.isHighRisk ? 'High Risk' : 'Normal Risk'})`);
                });
                // Return the analysis result
                res.json(analysisResult);
            }
            catch (error) {
                next(error);
            }
        });
        this.analysisService = analysisService;
        this.oruParser = oruParser;
    }
}
exports.AnalyzeController = AnalyzeController;
