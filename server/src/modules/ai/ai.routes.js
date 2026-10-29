import { Router } from 'express';
import { getAIStatus } from './ai.controller.js';

const router = Router();

// Status endpoint retained for system info
router.get('/status', getAIStatus);

// AI conversion / decomposition endpoints removed
router.all(['/decompose', '/approve'], (req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'AI_CONVERSION_REMOVED',
      message: 'AI-based task conversion has been removed. Use the SQL Query Studio or create tasks directly.',
    },
  });
});

export default router;
