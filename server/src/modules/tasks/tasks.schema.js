import { z } from 'zod';

const flexibleDateSchema = z
  .union([z.string(), z.date()])
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  });

export const SubtaskInputSchema = z.object({
  title: z.string().min(2, 'Subtask title must be at least 2 characters').max(200),
  description: z.string().max(1000).optional().default(''),
  category: z.string().optional().default('General'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().default('Medium'),
  status: z.enum(['inbox', 'draft', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled']).optional().default('todo'),
  estimatedMinutes: z.coerce.number().min(0).max(10080).optional().default(30),
  dueAt: flexibleDateSchema,
  dependencies: z.array(z.string()).optional().default([]),
  completionCriteria: z.string().max(500).optional().default(''),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(3000).optional().default(''),
  category: z.string().min(1).max(100).optional().default('General'),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional().default('Medium'),
  prioritySource: z.enum(['user_override', 'deterministic_engine', 'ai_suggested', 'ai_approved', 'manual']).optional().default('manual'),
  status: z.enum(['inbox', 'draft', 'todo', 'in_progress', 'blocked', 'completed', 'cancelled']).optional().default('todo'),
  dueAt: flexibleDateSchema,
  estimatedMinutes: z.coerce.number().min(0).max(10080).optional().default(60),
  subtasks: z.array(SubtaskInputSchema).optional().default([]),
  dependencies: z.array(z.string()).optional().default([]),
  recommendationReason: z.string().optional().default(''),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: z.string().datetime().nullable().optional(),
});

export const queryTasksSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  page: z.coerce.number().min(1).optional().default(1),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().min(1, 'Task ID parameter is required'),
});
