import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { pino } from 'pino';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './modules/health/health.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import queryRoutes from './modules/query/query.routes.js';

const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
});

export const createApp = () => {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : [env.CORS_ORIGIN, 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Structured HTTP logging (disabled in test)
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }

  // Request parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global rate limiter
  app.use('/api', rateLimiter());

  // Mount API v1 routes
  app.use('/api/v1', healthRoutes);
  app.use('/api/v1/tasks', tasksRoutes);
  app.use('/api/v1/categories', categoriesRoutes);
  app.use('/api/v1/query', queryRoutes);
  app.use('/api/v1/ai', aiRoutes);

  // 404 handler for unknown routes
  app.use(notFound);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
