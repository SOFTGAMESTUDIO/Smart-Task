import { tasksService } from './tasks.service.js';

export const getTasks = async (req, res, next) => {
  try {
    const result = await tasksService.list(req.query);
    res.status(200).json({
      success: true,
      data: result.tasks,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await tasksService.getById(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task with ID ${req.params.taskId} was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const created = await tasksService.create(req.body);
    res.status(201).json({
      success: true,
      data: created,
      message: 'Task created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const updated = await tasksService.update(req.params.taskId, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task with ID ${req.params.taskId} was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Task updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Safe cancellation or permanent deletion
export const deleteTask = async (req, res, next) => {
  try {
    const permanent = req.query.permanent === 'true';
    const deleted = await tasksService.delete(req.params.taskId, permanent);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task with ID ${req.params.taskId} was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: deleted,
      message: permanent ? 'Task permanently deleted' : 'Task removed (cancelled)',
    });
  } catch (error) {
    next(error);
  }
};

export const completeTask = async (req, res, next) => {
  try {
    const completed = await tasksService.complete(req.params.taskId);
    if (!completed) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task with ID ${req.params.taskId} was not found.`,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: completed,
      message: 'Task marked as completed',
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayTasks = async (req, res, next) => {
  try {
    const todayTasks = await tasksService.getTodayFocus();
    res.status(200).json({
      success: true,
      data: todayTasks,
    });
  } catch (error) {
    next(error);
  }
};
