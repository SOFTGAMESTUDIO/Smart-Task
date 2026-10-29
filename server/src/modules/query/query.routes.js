import { Router } from 'express';
import { executeQuery, getSchema, getPresets } from './query.controller.js';

const router = Router();

// POST /api/v1/query/execute — Execute arbitrary or parameterized SQL query
router.post('/execute', executeQuery);

// GET /api/v1/query/schema — Inspect SQLite database tables, columns, and row counts
router.get('/schema', getSchema);

// GET /api/v1/query/presets — Pre-built SQL queries for tasks, planning, and analytics
router.get('/presets', getPresets);

export default router;
