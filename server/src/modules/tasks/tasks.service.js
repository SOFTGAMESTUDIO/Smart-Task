import mongoose from 'mongoose';
import TaskModel from '../../database/models/Task.js';

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

// ─── In-memory resilient store ──────────────────────────────────────────────
const inMemoryTasks = new Map();

const seedInitialTasks = () => {
  if (inMemoryTasks.size > 0) return;

  const defaults = [
    {
      _id: 'mem-101',
      title: 'Fix React authentication state hydration bug',
      description: 'Resolve token loss on page reload and wire persistent refresh mechanism.',
      category: 'Freelance Coding',
      priority: 'Critical',
      prioritySource: 'deterministic_engine',
      status: 'in_progress',
      estimatedMinutes: 45,
      actualMinutes: 15,
      dueAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      dependencies: [],
      subtasks: [
        { _id: 'sub-1', title: 'Reproduce token drop locally', status: 'completed' },
        { _id: 'sub-2', title: 'Implement local storage listener hook', status: 'in_progress' },
        { _id: 'sub-3', title: 'Add regression integration test', status: 'todo' },
      ],
      recommendationReason: 'Hard deadline + client SLA requirement (weight 5)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mem-102',
      title: 'Prepare final deliverables for client review',
      description: 'Compile deployment instructions, run test suites, and draft summary email.',
      category: 'Office Work',
      priority: 'High',
      prioritySource: 'deterministic_engine',
      status: 'todo',
      estimatedMinutes: 60,
      actualMinutes: 0,
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      dependencies: ['mem-101'],
      subtasks: [
        { _id: 'sub-4', title: 'Export API documentation artifact', status: 'todo' },
        { _id: 'sub-5', title: 'Verify production Docker build', status: 'todo' },
      ],
      recommendationReason: 'Prerequisite for client billing milestone',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mem-103',
      title: 'Deliver 3 customer orders along North route',
      description: 'Scheduled drop-offs for delivery window before 6 PM.',
      category: 'Delivery Assignments',
      priority: 'High',
      prioritySource: 'deterministic_engine',
      status: 'todo',
      estimatedMinutes: 75,
      actualMinutes: 0,
      dueAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      dependencies: [],
      subtasks: [],
      recommendationReason: 'Operational delivery window constraint',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mem-104',
      title: 'Complete college assignment draft',
      description: 'Draft and submit the machine learning project report.',
      category: 'Education',
      priority: 'Medium',
      prioritySource: 'deterministic_engine',
      status: 'todo',
      estimatedMinutes: 90,
      actualMinutes: 0,
      dueAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      dependencies: [],
      subtasks: [
        { _id: 'sub-6', title: 'Write introduction section', status: 'todo' },
        { _id: 'sub-7', title: 'Add data analysis charts', status: 'todo' },
      ],
      recommendationReason: 'Academic deadline in 36 hours',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mem-105',
      title: 'Purchase evening groceries',
      description: 'Buy produce, dairy, and pantry essentials before store closes.',
      category: 'Personal Errands & Shopping',
      priority: 'Medium',
      prioritySource: 'deterministic_engine',
      status: 'todo',
      estimatedMinutes: 30,
      actualMinutes: 0,
      dueAt: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
      dependencies: ['mem-103'],
      subtasks: [],
      recommendationReason: 'After delivery run, same route',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'mem-106',
      title: 'Visit office for project sync meeting',
      description: 'Meet with team to review sprint progress and unblock pending issues.',
      category: 'Office Work',
      priority: 'Low',
      prioritySource: 'deterministic_engine',
      status: 'todo',
      estimatedMinutes: 60,
      actualMinutes: 0,
      dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      dependencies: [],
      subtasks: [],
      recommendationReason: 'Flexible window — no hard SLA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  defaults.forEach((t) => inMemoryTasks.set(t._id, t));
};

seedInitialTasks();

// ─── Category weight cache (refreshed from Categories module) ────────────────
let _categoryWeightCache = {};
export const setCategoryWeightCache = (map) => { _categoryWeightCache = map; };

export const tasksService = {
  async list({ status, category, priority, search, limit = 50, page = 1 } = {}) {
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (status) {
        filter.status = status;
      } else {
        filter.status = { $ne: 'cancelled' };
      }
      if (category && category !== 'All') filter.category = category;
      if (priority) filter.priority = priority;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const tasks = await TaskModel.find(filter)
        .sort({ dueAt: 1, createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await TaskModel.countDocuments(filter);

      // Apply deterministic scoring on top of DB results
      const scored = sortByPriorityScore(tasks, _categoryWeightCache);
      return { tasks: scored, total, page, limit };
    }

    // In-Memory Resilient Fallback
    let items = Array.from(inMemoryTasks.values());

    if (status) {
      items = items.filter((t) => t.status === status);
    } else {
      items = items.filter((t) => t.status !== 'cancelled');
    }
    if (category && category !== 'All') items = items.filter((t) => t.category === category);
    if (priority) items = items.filter((t) => t.priority === priority);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      );
    }

    // Sort in-memory by deterministic priority score
    const sorted = sortByPriorityScore(items, _categoryWeightCache);
    const paged = sorted.slice((page - 1) * limit, page * limit);

    return { tasks: paged, total: sorted.length, page, limit };
  },

  async create(taskData) {
    if (mongoose.connection.readyState === 1) {
      const created = await TaskModel.create(taskData);
      return created.toObject();
    }

    const _id = `mem-${Date.now()}`;
    const newTask = {
      _id,
      ...taskData,
      subtasks: (taskData.subtasks || []).map((s, idx) => ({
        _id: `sub-${Date.now()}-${idx}`,
        ...s,
      })),
      prioritySource: 'deterministic_engine',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryTasks.set(_id, newTask);
    return newTask;
  },

  async getById(id) {
    if (mongoose.connection.readyState === 1) {
      return await TaskModel.findById(id).lean();
    }
    return inMemoryTasks.get(id) || null;
  },

  async update(id, updates) {
    if (mongoose.connection.readyState === 1) {
      return await TaskModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();
    }

    const existing = inMemoryTasks.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    inMemoryTasks.set(id, updated);
    return updated;
  },

  // Delete task (soft delete by default, permanent if requested)
  async delete(id, permanent = false) {
    if (permanent) {
      if (mongoose.connection.readyState === 1) {
        return await TaskModel.findByIdAndDelete(id).lean();
      }
      const existing = inMemoryTasks.get(id);
      inMemoryTasks.delete(id);
      return existing || null;
    }
    return this.softDelete(id);
  },

  // Non-destructive soft-delete
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

    // Already sorted by priority score from list()
    return todayTasks;
  },
};

export default tasksService;
