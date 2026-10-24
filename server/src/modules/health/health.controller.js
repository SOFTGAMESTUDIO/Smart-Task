import { getDatabaseStatus } from '../../config/database.js';
import { checkOllamaStatus } from '../../config/ollama.js';
import { env } from '../../config/env.js';

const startTime = Date.now();

export const getHealth = async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const dbStatus = getDatabaseStatus();
    
    // Check ollama status quickly without blocking
    const ollamaStatus = await checkOllamaStatus();

    const isHealthy = true; // Service is alive

    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: '1.0.0',
        services: {
          database: dbStatus,
          ollama: ollamaStatus.reachable ? 'connected' : 'offline',
          ollamaModels: ollamaStatus.models || [],
        },
        system: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        },
      },
      message: 'Smart Task Management System API is operational',
    });
  } catch (error) {
    next(error);
  }
};
