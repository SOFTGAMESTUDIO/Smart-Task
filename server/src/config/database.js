import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from './env.js';

let dbInstance = null;
let isConnected = false;
let connectPromise = null;

const ensureConnected = async () => {
  if (isConnected && dbInstance) return true;
  return await connectDatabase();
};

// Promisified helpers with auto-connect
export const dbRun = async (sql, params = []) => {
  await ensureConnected();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error('Database not initialized'));
    dbInstance.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = async (sql, params = []) => {
  await ensureConnected();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error('Database not initialized'));
    dbInstance.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

export const dbAll = async (sql, params = []) => {
  await ensureConnected();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error('Database not initialized'));
    dbInstance.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

export const dbExec = async (sql) => {
  await ensureConnected();
  return new Promise((resolve, reject) => {
    if (!dbInstance) return reject(new Error('Database not initialized'));
    dbInstance.exec(sql, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
};

export const getDatabase = () => dbInstance;

export const getDatabaseStatus = () => {
  return isConnected && dbInstance ? 'connected' : 'disconnected';
};

const defaultCategories = [
  { id: 'cat-1', name: 'Home & Family Responsibilities', weight: 5, color: '#10b981', icon: 'Home' },
  { id: 'cat-2', name: 'Delivery Assignments', weight: 5, color: '#f59e0b', icon: 'Truck' },
  { id: 'cat-3', name: 'Office Work', weight: 4, color: '#3b82f6', icon: 'Briefcase' },
  { id: 'cat-4', name: 'Freelance Coding', weight: 3, color: '#6366f1', icon: 'Code' },
  { id: 'cat-5', name: 'Personal Errands & Shopping', weight: 2, color: '#a855f7', icon: 'ShoppingBag' },
  { id: 'cat-6', name: 'Education', weight: 3, color: '#06b6d4', icon: 'BookOpen' },
];

const defaultTasks = [
  {
    id: 'mem-101',
    title: 'Fix React authentication state hydration bug',
    description: 'Resolve token loss on page reload and wire persistent refresh mechanism.',
    category: 'Freelance Coding',
    priority: 'Critical',
    prioritySource: 'deterministic_engine',
    status: 'in_progress',
    estimatedMinutes: 45,
    actualMinutes: 15,
    dueAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    dependencies: '[]',
    recommendationReason: 'Hard deadline + client SLA requirement (weight 5)',
    subtasks: [
      { id: 'sub-1', title: 'Reproduce token drop locally', status: 'completed' },
      { id: 'sub-2', title: 'Implement local storage listener hook', status: 'in_progress' },
      { id: 'sub-3', title: 'Add regression integration test', status: 'todo' },
    ],
  },
  {
    id: 'mem-102',
    title: 'Prepare final deliverables for client review',
    description: 'Compile deployment instructions, run test suites, and draft summary email.',
    category: 'Office Work',
    priority: 'High',
    prioritySource: 'deterministic_engine',
    status: 'todo',
    estimatedMinutes: 60,
    actualMinutes: 0,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    dependencies: '["mem-101"]',
    recommendationReason: 'Prerequisite for client billing milestone',
    subtasks: [
      { id: 'sub-4', title: 'Export API documentation artifact', status: 'todo' },
      { id: 'sub-5', title: 'Verify production Docker build', status: 'todo' },
    ],
  },
  {
    id: 'mem-103',
    title: 'Deliver 3 customer orders along North route',
    description: 'Scheduled drop-offs for delivery window before 6 PM.',
    category: 'Delivery Assignments',
    priority: 'High',
    prioritySource: 'deterministic_engine',
    status: 'todo',
    estimatedMinutes: 75,
    actualMinutes: 0,
    dueAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    dependencies: '[]',
    recommendationReason: 'Operational delivery window constraint',
    subtasks: [],
  },
  {
    id: 'mem-104',
    title: 'Complete college assignment draft',
    description: 'Draft and submit the machine learning project report.',
    category: 'Education',
    priority: 'Medium',
    prioritySource: 'deterministic_engine',
    status: 'todo',
    estimatedMinutes: 90,
    actualMinutes: 0,
    dueAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    dependencies: '[]',
    recommendationReason: 'Academic deadline in 36 hours',
    subtasks: [
      { id: 'sub-6', title: 'Write introduction section', status: 'todo' },
      { id: 'sub-7', title: 'Add data analysis charts', status: 'todo' },
    ],
  },
  {
    id: 'mem-105',
    title: 'Purchase evening groceries',
    description: 'Buy produce, dairy, and pantry essentials before store closes.',
    category: 'Personal Errands & Shopping',
    priority: 'Medium',
    prioritySource: 'deterministic_engine',
    status: 'todo',
    estimatedMinutes: 30,
    actualMinutes: 0,
    dueAt: new Date(Date.now() + 7 * 3600 * 1000).toISOString(),
    dependencies: '["mem-103"]',
    recommendationReason: 'After delivery run, same route',
    subtasks: [],
  },
  {
    id: 'mem-106',
    title: 'Visit office for project sync meeting',
    description: 'Meet with team to review sprint progress and unblock pending issues.',
    category: 'Office Work',
    priority: 'Low',
    prioritySource: 'deterministic_engine',
    status: 'todo',
    estimatedMinutes: 60,
    actualMinutes: 0,
    dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    dependencies: '[]',
    recommendationReason: 'Flexible window — no hard SLA',
    subtasks: [],
  },
];

const runRaw = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getRaw = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const initializeTables = async (db) => {
  await runRaw(db, 'PRAGMA foreign_keys = ON;');

  await runRaw(db, `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      weight INTEGER NOT NULL DEFAULT 3,
      color TEXT DEFAULT '#3b82f6',
      icon TEXT DEFAULT 'Tag',
      isSystem INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );
  `);

  await runRaw(db, `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'Medium',
      prioritySource TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'todo',
      dueAt TEXT,
      estimatedMinutes INTEGER DEFAULT 60,
      actualMinutes INTEGER DEFAULT 0,
      dependencies TEXT DEFAULT '[]',
      isAiGenerated INTEGER DEFAULT 0,
      isApproved INTEGER DEFAULT 1,
      recommendationReason TEXT DEFAULT '',
      ownerId TEXT DEFAULT 'user-default',
      completedAt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
  `);

  await runRaw(db, `
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'todo',
      estimatedMinutes INTEGER DEFAULT 30,
      actualMinutes INTEGER DEFAULT 0,
      dueAt TEXT,
      dependencies TEXT DEFAULT '[]',
      completionCriteria TEXT DEFAULT '',
      completedAt TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  await runRaw(db, 'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);');
  await runRaw(db, 'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);');
  await runRaw(db, 'CREATE INDEX IF NOT EXISTS idx_tasks_dueAt ON tasks(dueAt);');
  await runRaw(db, 'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);');
  await runRaw(db, 'CREATE INDEX IF NOT EXISTS idx_subtasks_taskId ON subtasks(taskId);');

  const catCount = await getRaw(db, 'SELECT COUNT(*) as count FROM categories');
  if (catCount && catCount.count === 0) {
    const now = new Date().toISOString();
    for (const cat of defaultCategories) {
      await runRaw(
        db,
        `INSERT INTO categories (id, name, weight, color, icon, isSystem, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [cat.id, cat.name, cat.weight, cat.color, cat.icon, now, now]
      );
    }
  }

  const taskCount = await getRaw(db, 'SELECT COUNT(*) as count FROM tasks');
  if (taskCount && taskCount.count === 0) {
    const now = new Date().toISOString();
    for (const t of defaultTasks) {
      await runRaw(
        db,
        `INSERT INTO tasks (
          id, title, description, category, priority, prioritySource,
          status, dueAt, estimatedMinutes, actualMinutes, dependencies,
          isAiGenerated, isApproved, recommendationReason, ownerId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, 'user-default', ?, ?)`,
        [
          t.id,
          t.title,
          t.description,
          t.category,
          t.priority,
          t.prioritySource,
          t.status,
          t.dueAt,
          t.estimatedMinutes,
          t.actualMinutes,
          t.dependencies,
          t.recommendationReason,
          now,
          now,
        ]
      );

      for (const st of t.subtasks || []) {
        await runRaw(
          db,
          `INSERT INTO subtasks (
            id, taskId, title, status, estimatedMinutes, actualMinutes,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 30, 0, ?, ?)`,
          [st.id, t.id, st.title, st.status, now, now]
        );
      }
    }
  }
};

export const connectDatabase = async () => {
  if (isConnected && dbInstance) {
    return true;
  }
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise((resolve) => {
    let dbFilePath = env.SQLITE_DB_PATH || './src/database/tasks.sqlite';

    // If running in test mode, create a local test db or memory db
    // Note: sqlite3 in-memory ":memory:" loses data if opened with multiple connections,
    // so using a dedicated test file in test mode provides solid state across requests.
    if (env.NODE_ENV === 'test') {
      dbFilePath = path.resolve(process.cwd(), './src/database/test_tasks.sqlite');
    } else {
      if (!path.isAbsolute(dbFilePath)) {
        dbFilePath = path.resolve(process.cwd(), dbFilePath);
      }
    }

    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
      if (err) {
        console.warn(`⚠️ SQLite database connection warning: ${err.message}`);
        dbInstance = new sqlite3.Database(':memory:');
      } else {
        dbInstance = db;
        console.log(`✅ Local SQL (SQLite) database connected: ${dbFilePath}`);
      }

      isConnected = true;

      try {
        await initializeTables(dbInstance);
        resolve(true);
      } catch (initErr) {
        console.error('❌ Failed to initialize SQLite schema:', initErr);
        resolve(false);
      } finally {
        connectPromise = null;
      }
    });
  });

  return connectPromise;
};

export const disconnectDatabase = async () => {
  if (!dbInstance) return;
  return new Promise((resolve) => {
    dbInstance.close((err) => {
      if (err) {
        console.error('Error closing SQLite database:', err);
      }
      dbInstance = null;
      isConnected = false;
      connectPromise = null;
      resolve();
    });
  });
};

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabase,
  getDatabaseStatus,
  dbRun,
  dbGet,
  dbAll,
  dbExec,
};
