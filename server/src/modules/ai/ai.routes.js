import { Router } from 'express';
import { decomposeTask, approveDecomposition, getAIStatus } from './ai.controller.js';

const router = Router();

// GET /api/v1/ai/status — Ollama connection status
router.get('/status', getAIStatus);

// POST /api/v1/ai/decompose — Decompose task with local LLM
router.post('/decompose', decomposeTask);

// POST /api/v1/ai/approve — Human-in-the-Loop: approve and persist subtasks
router.post('/approve', approveDecomposition);

export default router;
