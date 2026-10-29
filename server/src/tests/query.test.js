import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase } from '../config/database.js';

describe('SQL Query API Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  it('GET /api/v1/query/presets should return predefined SQL queries', async () => {
    const res = await request(app).get('/api/v1/query/presets');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('sql');
  });

  it('GET /api/v1/query/schema should return database table schema information', async () => {
    const res = await request(app).get('/api/v1/query/schema');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('tables');
    expect(Array.isArray(res.body.data.tables)).toBe(true);

    const tableNames = res.body.data.tables.map((t) => t.name);
    expect(tableNames).toContain('tasks');
    expect(tableNames).toContain('categories');
    expect(tableNames).toContain('subtasks');
  });

  it('POST /api/v1/query/execute should execute a SELECT query and return rows and columns', async () => {
    const res = await request(app)
      .post('/api/v1/query/execute')
      .send({ query: 'SELECT id, title, priority, status FROM tasks LIMIT 5;' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('columns');
    expect(res.body.data).toHaveProperty('rows');
    expect(res.body.data).toHaveProperty('rowCount');
    expect(res.body.data).toHaveProperty('executionTimeMs');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
  });

  it('POST /api/v1/query/execute should reject invalid SQL syntax safely', async () => {
    const res = await request(app)
      .post('/api/v1/query/execute')
      .send({ query: 'SELECT FROM INVALID TABLE SYNTAX HERE;' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'SQL_EXECUTION_ERROR');
    expect(res.body.error).toHaveProperty('message');
  });

  it('POST /api/v1/ai/decompose should return 410 indicating AI conversion has been removed', async () => {
    const res = await request(app)
      .post('/api/v1/ai/decompose')
      .send({ taskDescription: 'Do something via AI' });

    expect(res.status).toBe(410);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AI_CONVERSION_REMOVED');
  });
});
