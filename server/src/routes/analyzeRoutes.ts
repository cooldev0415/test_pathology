import { Router } from 'express';
import multer from 'multer';
import { AnalyzeController } from '../controllers/analyzeController';
import { DataService } from '../services/dataService';
import { checkDataLoaded } from '../middleware/dataMiddleware';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only text files are allowed'));
    }
  }
});

export const setupAnalyzeRoutes = (controller: AnalyzeController, dataService: DataService): Router => {
  const router = Router();

  router.post(
    '/analyze-oru',
    checkDataLoaded(dataService),
    upload.single('oruFile'),
    (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      next();
    },
    controller.analyzeORU
  );

  return router;
}; 