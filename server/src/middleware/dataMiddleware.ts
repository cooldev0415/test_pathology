import { Request, Response, NextFunction } from 'express';
import { DataService } from '../services/dataService';
import { AppError } from '../utils/AppError';

export const checkDataLoaded = (dataService: DataService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!dataService.isDataLoaded()) {
      return next(new AppError('Data is not loaded yet. Please try again in a moment.', 503));
    }
    next();
  };
}; 