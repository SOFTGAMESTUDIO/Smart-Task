import { performance } from 'perf_hooks';
import { dbAll, dbGet, dbRun } from '../../config/database.js';

export const queryService = {
  async executeQuery(rawSql, params = []) {
    const trimmed = (rawSql || '').trim();
    if (!trimmed) {
      throw new Error('Query string cannot be empty');
    }

    const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
    const isSelect = ['SELECT', 'PRAGMA', 'EXPLAIN', 'WITH'].includes(firstWord);

    const startTime = performance.now();

    if (isSelect) {
      const rows = await dbAll(trimmed, params);
      const endTime = performance.now();
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return {
        query: trimmed,
        statementType: firstWord === 'WITH' ? 'SELECT' : firstWord,
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs: Number((endTime - startTime).toFixed(2)),
      };
    } else {
      const result = await dbRun(trimmed, params);
      const endTime = performance.now();

      return {
        query: trimmed,
        statementType: 'MUTATION',
        columns: ['lastID', 'changes'],
        rows: [{ lastID: result.lastID, changes: result.changes }],
        rowCount: result.changes,
        lastID: result.lastID,
        changes: result.changes,
        executionTimeMs: Number((endTime - startTime).toFixed(2)),
        message: `Query executed successfully (${result.changes} row(s) affected)`,
      };
    }
  },

  async getSchema() {
    const tableNames = ['tasks', 'subtasks', 'categories'];
    const tables = [];

    for (const name of tableNames) {
      const countRow = await dbGet(`SELECT COUNT(*) as count FROM ${name}`);
      const infoRows = await dbAll(`PRAGMA table_info(${name})`);

      tables.push({
        name,
        rowCount: countRow ? countRow.count : 0,
        columns: infoRows.map((col) => ({
          name: col.name,
          type: col.type,
          notNull: Boolean(col.notnull),
          defaultValue: col.dflt_value,
          primaryKey: Boolean(col.pk),
        })),
      });
    }

    return { tables };
  },

  getPresets() {
    return [
      {
        id: 'active-tasks-prioritized',
        title: 'Active Tasks by Priority',
        description: 'Lists all uncancelled tasks sorted by deterministic priority levels (Critical to Low)',
        category: 'Tasks',
        sql: `SELECT id, title, category, priority, status, dueAt, estimatedMinutes
FROM tasks
WHERE status != 'cancelled'
ORDER BY CASE priority
  WHEN 'Critical' THEN 1
  WHEN 'High' THEN 2
  WHEN 'Medium' THEN 3
  ELSE 4
END;`,
      },
      {
        id: 'upcoming-deadlines',
        title: 'Upcoming Deadlines & Overdue Tasks',
        description: 'Finds pending tasks ordered by urgency and due date',
        category: 'Planning',
        sql: `SELECT id, title, category, priority, status, dueAt
FROM tasks
WHERE dueAt IS NOT NULL AND status NOT IN ('completed', 'cancelled')
ORDER BY dueAt ASC;`,
      },
      {
        id: 'category-workload',
        title: 'Workload & Time by Category',
        description: 'Aggregates task count and total estimated duration grouped by category',
        category: 'Analytics',
        sql: `SELECT category,
  COUNT(*) AS totalTasks,
  SUM(estimatedMinutes) AS totalEstimatedMinutes,
  SUM(actualMinutes) AS totalActualMinutes
FROM tasks
WHERE status != 'cancelled'
GROUP BY category
ORDER BY totalTasks DESC;`,
      },
      {
        id: 'subtask-progress',
        title: 'Tasks with Subtask Progress',
        description: 'Shows each task along with total subtasks and completed subtask count',
        category: 'Tasks',
        sql: `SELECT t.id, t.title, t.category, t.priority, t.status,
  COUNT(s.id) AS totalSubtasks,
  SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completedSubtasks
FROM tasks t
LEFT JOIN subtasks s ON t.id = s.taskId
WHERE t.status != 'cancelled'
GROUP BY t.id;`,
      },
      {
        id: 'critical-high-backlog',
        title: 'Critical & High Priority Backlog',
        description: 'Filters for unfinished high-impact items that need immediate attention',
        category: 'Planning',
        sql: `SELECT id, title, category, status, dueAt, estimatedMinutes
FROM tasks
WHERE priority IN ('Critical', 'High') AND status = 'todo'
ORDER BY createdAt DESC;`,
      },
      {
        id: 'category-weights',
        title: 'Category Weight Configuration',
        description: 'Inspects user-configured deterministic category weights (1 to 5)',
        category: 'Settings',
        sql: `SELECT id, name, weight, color, isSystem
FROM categories
ORDER BY weight DESC, name ASC;`,
      },
      {
        id: 'status-breakdown',
        title: 'Status Distribution Breakdown',
        description: 'Calculates the proportion of tasks in each lifecycle state',
        category: 'Analytics',
        sql: `SELECT status,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks), 1) AS percentage
FROM tasks
GROUP BY status;`,
      },
      {
        id: 'long-tasks',
        title: 'Tasks Over 60 Minutes',
        description: 'Identifies deep-work tasks requiring more than 1 hour',
        category: 'Planning',
        sql: `SELECT id, title, category, priority, estimatedMinutes
FROM tasks
WHERE estimatedMinutes > 60
ORDER BY estimatedMinutes DESC;`,
      },
    ];
  },
};

export default queryService;
