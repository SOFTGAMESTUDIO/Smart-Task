import { z } from 'zod';
import { decomposeTaskWithOllama, checkOllamaHealth } from './ollama.service.js';
import { tasksService } from '../tasks/tasks.service.js';

const decomposeSchema = z.object({
  taskDescription: z
    .string()
    .min(5, 'Task description must be at least 5 characters')
    .max(3000, 'Task description must be under 3000 characters'),
  model: z.string().optional(),
});

const approveSchema = z.object({
  originalInput: z.string().optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string().min(2),
        category: z.string().min(1),
        priority: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
        estimatedMinutes: z.coerce.number().min(1).max(1440).default(30),
        deadline: z.string().optional(),
        dueDays: z.coerce.number().optional(),
        dueAt: z.string().nullable().optional(),
        dependencies: z.string().optional(),
      })
    )
    .min(1, 'Must approve at least one subtask'),
});

// POST /api/v1/ai/decompose
export const decomposeTask = async (req, res, next) => {
  try {
    const { taskDescription, model } = decomposeSchema.parse(req.body);
    const result = await decomposeTaskWithOllama(taskDescription, model);

    return res.status(200).json({
      success: true,
      data: result,
      message: `Task decomposed by local model (${result.model}) — review before approving`,
    });
  } catch (error) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: error.errors,
        },
      });
    }

    // LLM offline/timeout — friendly error
    return res.status(503).json({
      success: false,
      error: {
        code: 'AI_UNAVAILABLE',
        message: error.message || 'Local Ollama LLM is currently unavailable',
        hint: 'Ensure Ollama is running (ollama serve) and Qwen or Llama model is loaded',
      },
    });
  }
};

// POST /api/v1/ai/approve — Human-in-the-Loop: save approved subtasks as real tasks into database
export const approveDecomposition = async (req, res, next) => {
  try {
    const body = approveSchema.parse(req.body);

    const created = await Promise.all(
      body.subtasks.map((s) => {
        let taskDueAt = s.dueAt || null;
        if (!taskDueAt && typeof s.dueDays === 'number') {
          taskDueAt = new Date(Date.now() + s.dueDays * 24 * 3600 * 1000).toISOString();
        }

        return tasksService.create({
          title: s.title,
          category: s.category,
          priority: s.priority,
          estimatedMinutes: s.estimatedMinutes,
          dueAt: taskDueAt,
          status: 'todo',
          prioritySource: 'ai_approved',
          recommendationReason: s.deadline && s.deadline !== 'Flexible' ? s.deadline : 'AI decomposed & approved',
          subtasks: [],
          dependencies: s.dependencies && s.dependencies !== 'None' ? [s.dependencies] : [],
        });
      })
    );

    return res.status(201).json({
      success: true,
      data: created,
      message: `${created.length} AI-proposed tasks approved and saved to database`,
    });
  } catch (error) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Approved tasks format invalid',
          details: error.errors,
        },
      });
    }
    next(error);
  }
};

// GET /api/v1/ai/status
export const getAIStatus = async (req, res, next) => {
  try {
    const health = await checkOllamaHealth();
    res.status(200).json({
      success: true,
      data: {
        ollama: health.reachable ? 'connected' : 'disconnected',
        models: health.models,
        activeModel: health.activeModel,
        baseUrl: 'http://localhost:11434',
      },
    });
  } catch (error) {
    next(error);
  }
};
