import { Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysisService';
import { ORUParser } from '../services/oruParser';
import { AppError } from '../utils/AppError';
import { DiagnosticResult } from '../types/result';

export class AnalyzeController {
  private analysisService: AnalysisService;
  private oruParser: ORUParser;

  constructor(analysisService: AnalysisService, oruParser: ORUParser) {
    this.analysisService = analysisService;
    this.oruParser = oruParser;
  }

  public analyzeORU = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      console.log('File received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const oruContent = req.file.buffer.toString('utf8');
      
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
      } catch (parseError: any) {
        console.error('Error parsing ORU file:', parseError);
        throw new AppError(`Error parsing ORU file: ${parseError.message}`, 400);
      }

      console.log('Analyzing ORU data...');
      const analysisResult = this.analysisService.analyzeORUData(oruData);
      
      console.log('Analysis summary:');
      console.log(`- Patient: ${analysisResult.patientInfo.name}`);
      console.log(`- Doctor: ${analysisResult.doctorInfo.name}`);
      console.log(`- Abnormal results: ${analysisResult.abnormalResults.length}`);
      analysisResult.abnormalResults.forEach(result => {
        console.log(`  - ${result.testName}: ${result.value} ${result.units} (${result.isHighRisk ? 'High Risk' : 'Normal Risk'})`);
      });

      res.json(analysisResult);
    } catch (error) {
      next(error);
    }
  };
} 