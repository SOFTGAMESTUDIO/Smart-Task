import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Tasks API Integration Tests (Non-destructive / Isolated)', () => {
  const app = createApp();
  let createdTaskId = null;

  it('GET /api/v1/tasks should return list of tasks with pagination meta', async () => {
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('POST /api/v1/tasks should create a new validated task', async () => {
    const newTaskPayload = {
      title: 'Automated test task creation',
      description: 'Verifies dynamic validation and creation',
      category: 'Freelance Coding',
      priority: 'High',
      status: 'todo',
      estimatedMinutes: 45,
      subtasks: [
        { title: 'Subtask test 1', status: 'todo' },
        { title: 'Subtask test 2', status: 'todo' },
      ],
    };

    const res = await request(app)
      .post('/api/v1/tasks')
      .send(newTaskPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(newTaskPayload.title);
    expect(res.body.data.priority).toBe('High');
    expect(res.body.data.subtasks.length).toBe(2);

    createdTaskId = res.body.data._id;
  });

  it('GET /api/v1/tasks/:taskId should fetch single task details', async () => {
    expect(createdTaskId).toBeDefined();

    const res = await request(app).get(`/api/v1/tasks/${createdTaskId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(createdTaskId);
  });

  it('PATCH /api/v1/tasks/:taskId should update task fields', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${createdTaskId}`)
      .send({ priority: 'Critical', estimatedMinutes: 60 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priority).toBe('Critical');
    expect(res.body.data.estimatedMinutes).toBe(60);
  });

  it('POST /api/v1/tasks/:taskId/complete should mark task completed', async () => {
    const res = await request(app).post(`/api/v1/tasks/${createdTaskId}/complete`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).toBeDefined();
  });

  it('DELETE /api/v1/tasks/:taskId should cancel task non-destructively without purging', async () => {
    const res = await request(app).delete(`/api/v1/tasks/${createdTaskId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('cancelled');
  });

  it('GET /api/v1/categories should return available categories and weights', async () => {
    const res = await request(app).get('/api/v1/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('weight');
  });
});
