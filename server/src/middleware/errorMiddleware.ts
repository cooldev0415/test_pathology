import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.message === 'File too large') {
      res.status(400).json({ error: 'File size exceeds the 5MB limit' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}; 