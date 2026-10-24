import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  createTaskSchema,
  updateTaskSchema,
  queryTasksSchema,
  taskIdParamSchema,
} from './tasks.schema.js';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTodayTasks,
} from './tasks.controller.js';

const router = Router();

router.get('/today', getTodayTasks);

router.get(
  '/',
  validateRequest({ query: queryTasksSchema }),
  getTasks
);

router.post(
  '/',
  validateRequest({ body: createTaskSchema }),
  createTask
);

router.get(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema }),
  getTaskById
);

router.patch(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema, body: updateTaskSchema }),
  updateTask
);

router.delete(
  '/:taskId',
  validateRequest({ params: taskIdParamSchema }),
  deleteTask
);

router.post(
  '/:taskId/complete',
  validateRequest({ params: taskIdParamSchema }),
  completeTask
);

export default router;
