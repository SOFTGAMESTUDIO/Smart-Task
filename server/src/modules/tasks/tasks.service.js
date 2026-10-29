import { dbAll, dbGet, dbRun } from '../../config/database.js';

// ─── Deterministic Priority Scoring Engine ─────────────────────────────────
// score = (categoryWeight × 20) + urgencyScore + deadlineScore
// Hard deadlines always trump weight-based preferences
const PRIORITY_SCORE = { Critical: 80, High: 60, Medium: 35, Low: 15 };

export const computePriorityScore = (task, categoryWeightMap = {}) => {
  const weight = categoryWeightMap[task.category] || 3; // default weight 3/5
  const categoryFactor = weight * 20; // 20–100

  const priorityFactor = PRIORITY_SCORE[task.priority] || 35;

  let deadlineFactor = 0;
  if (task.dueAt) {
    const hoursUntilDue = (new Date(task.dueAt) - Date.now()) / 3600000;
    if (hoursUntilDue <= 0) deadlineFactor = 200;        // overdue
    else if (hoursUntilDue <= 2) deadlineFactor = 150;   // < 2 hours
    else if (hoursUntilDue <= 6) deadlineFactor = 100;   // < 6 hours
    else if (hoursUntilDue <= 24) deadlineFactor = 60;   // < 1 day
    else if (hoursUntilDue <= 72) deadlineFactor = 30;   // < 3 days
    else deadlineFactor = 10;
  }

  // Dependency penalty: tasks with unresolved dependencies deprioritised
  const depPenalty = (task.dependencies && task.dependencies.length > 0) ? -20 : 0;

  return categoryFactor + priorityFactor + deadlineFactor + depPenalty;
};

const sortByPriorityScore = (tasks, categoryWeightMap = {}) => {
  return tasks
    .map((t) => ({ ...t, _score: computePriorityScore(t, categoryWeightMap) }))
    .sort((a, b) => b._score - a._score);
};

// ─── Category weight cache (refreshed from Categories module) ────────────────
let _categoryWeightCache = {};
export const setCategoryWeightCache = (map) => { _categoryWeightCache = map; };

// Helper to format task object from SQLite row
const formatTaskRow = (row, subtasks = []) => {
  if (!row) return null;
  let deps = [];
  try {
    deps = typeof row.dependencies === 'string' ? JSON.parse(row.dependencies || '[]') : (row.dependencies || []);
  } catch {
    deps = [];
  }

  return {
    ...row,
    _id: row.id,
    id: row.id,
    dependencies: deps,
    isAiGenerated: Boolean(row.isAiGenerated),
    isApproved: Boolean(row.isApproved),
    subtasks: subtasks.map((st) => ({
      ...st,
      _id: st.id,
      id: st.id,
    })),
  };
};

export const tasksService = {
  async list({ status, category, priority, search, limit = 50, page = 1 } = {}) {
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    } else {
      conditions.push("status != 'cancelled'");
    }

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await dbGet(`SELECT COUNT(*) as total FROM tasks ${whereClause}`, params);
    const total = countRow ? countRow.total : 0;

    const offset = (page - 1) * limit;
    const rows = await dbAll(
      `SELECT * FROM tasks ${whereClause} ORDER BY dueAt ASC, createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const taskIds = rows.map((r) => r.id);
    const subtasksMap = {};

    if (taskIds.length > 0) {
      const placeholders = taskIds.map(() => '?').join(',');
      const subtaskRows = await dbAll(
        `SELECT * FROM subtasks WHERE taskId IN (${placeholders}) ORDER BY createdAt ASC`,
        taskIds
      );

      for (const st of subtaskRows) {
        if (!subtasksMap[st.taskId]) subtasksMap[st.taskId] = [];
        subtasksMap[st.taskId].push(st);
      }
    }

    const tasks = rows.map((r) => formatTaskRow(r, subtasksMap[r.id] || []));
    const scored = sortByPriorityScore(tasks, _categoryWeightCache);

    return { tasks: scored, total, page, limit };
  },

  async create(taskData) {
    const id = taskData.id || taskData._id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const title = taskData.title;
    const description = taskData.description || '';
    const category = taskData.category || 'General';
    const priority = taskData.priority || 'Medium';
    const prioritySource = taskData.prioritySource || 'manual';
    const status = taskData.status || 'todo';
    const dueAt = taskData.dueAt || null;
    const estimatedMinutes = Number(taskData.estimatedMinutes) || 60;
    const actualMinutes = Number(taskData.actualMinutes) || 0;
    const dependencies = JSON.stringify(taskData.dependencies || []);
    const isAiGenerated = taskData.isAiGenerated ? 1 : 0;
    const isApproved = taskData.isApproved !== false ? 1 : 0;
    const recommendationReason = taskData.recommendationReason || '';
    const ownerId = taskData.ownerId || 'user-default';

    await dbRun(
      `INSERT INTO tasks (
        id, title, description, category, priority, prioritySource,
        status, dueAt, estimatedMinutes, actualMinutes, dependencies,
        isAiGenerated, isApproved, recommendationReason, ownerId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description,
        category,
        priority,
        prioritySource,
        status,
        dueAt,
        estimatedMinutes,
        actualMinutes,
        dependencies,
        isAiGenerated,
        isApproved,
        recommendationReason,
        ownerId,
        now,
        now,
      ]
    );

    const subtasks = [];
    if (Array.isArray(taskData.subtasks)) {
      for (let i = 0; i < taskData.subtasks.length; i++) {
        const s = taskData.subtasks[i];
        const subId = s.id || s._id || `sub-${Date.now()}-${i}`;
        const subTitle = s.title;
        const subDesc = s.description || '';
        const subCat = s.category || category;
        const subPriority = s.priority || 'Medium';
        const subStatus = s.status || 'todo';
        const subEst = Number(s.estimatedMinutes) || 30;
        const subAct = Number(s.actualMinutes) || 0;
        const subDue = s.dueAt || null;
        const subDeps = JSON.stringify(s.dependencies || []);
        const subCriteria = s.completionCriteria || '';

        await dbRun(
          `INSERT INTO subtasks (
            id, taskId, title, description, category, priority, status,
            estimatedMinutes, actualMinutes, dueAt, dependencies, completionCriteria,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subId,
            id,
            subTitle,
            subDesc,
            subCat,
            subPriority,
            subStatus,
            subEst,
            subAct,
            subDue,
            subDeps,
            subCriteria,
            now,
            now,
          ]
        );

        subtasks.push({
          id: subId,
          _id: subId,
          taskId: id,
          title: subTitle,
          description: subDesc,
          category: subCat,
          priority: subPriority,
          status: subStatus,
          estimatedMinutes: subEst,
          actualMinutes: subAct,
          dueAt: subDue,
        });
      }
    }

    const created = await this.getById(id);
    return created;
  },

  async getById(id) {
    const row = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!row) return null;

    const subtaskRows = await dbAll('SELECT * FROM subtasks WHERE taskId = ? ORDER BY createdAt ASC', [id]);
    return formatTaskRow(row, subtaskRows);
  },

  async update(id, updates) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const allowedFields = [
      'title',
      'description',
      'category',
      'priority',
      'prioritySource',
      'status',
      'dueAt',
      'estimatedMinutes',
      'actualMinutes',
      'dependencies',
      'isAiGenerated',
      'isApproved',
      'recommendationReason',
      'ownerId',
      'completedAt',
    ];

    const setClauses = [];
    const params = [];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        setClauses.push(`${key} = ?`);
        if (key === 'dependencies' && typeof updates[key] !== 'string') {
          params.push(JSON.stringify(updates[key]));
        } else if (key === 'isAiGenerated' || key === 'isApproved') {
          params.push(updates[key] ? 1 : 0);
        } else {
          params.push(updates[key]);
        }
      }
    }

    setClauses.push('updatedAt = ?');
    params.push(new Date().toISOString());

    params.push(id);

    if (setClauses.length > 1) {
      await dbRun(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    // Handle subtasks replacement if provided
    if (Array.isArray(updates.subtasks)) {
      await dbRun('DELETE FROM subtasks WHERE taskId = ?', [id]);
      const now = new Date().toISOString();
      for (let i = 0; i < updates.subtasks.length; i++) {
        const s = updates.subtasks[i];
        const subId = s.id || s._id || `sub-${Date.now()}-${i}`;
        await dbRun(
          `INSERT INTO subtasks (
            id, taskId, title, description, category, priority, status,
            estimatedMinutes, actualMinutes, dueAt, dependencies, completionCriteria,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            subId,
            id,
            s.title,
            s.description || '',
            s.category || existing.category,
            s.priority || 'Medium',
            s.status || 'todo',
            Number(s.estimatedMinutes) || 30,
            Number(s.actualMinutes) || 0,
            s.dueAt || null,
            JSON.stringify(s.dependencies || []),
            s.completionCriteria || '',
            now,
            now,
          ]
        );
      }
    }

    return await this.getById(id);
  },

  async delete(id, permanent = false) {
    const existing = await this.getById(id);
    if (!existing) return null;

    if (permanent) {
      await dbRun('DELETE FROM subtasks WHERE taskId = ?', [id]);
      await dbRun('DELETE FROM tasks WHERE id = ?', [id]);
      return existing;
    }

    return this.softDelete(id);
  },

  async softDelete(id) {
    return this.update(id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  },

  async complete(id) {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  },

  async getTodayFocus() {
    const all = await this.list({ limit: 200 });
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTasks = all.tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (!t.dueAt) return t.priority === 'Critical' || t.priority === 'High';
      const due = new Date(t.dueAt);
      return due <= endOfDay || t.priority === 'Critical';
    });

    return todayTasks;
  },
};

export default tasksService;
