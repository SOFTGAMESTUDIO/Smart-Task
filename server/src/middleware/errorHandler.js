import { ZodError } from 'zod';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Log server-side diagnostic details
  const correlationId = req.headers['x-request-id'] || `req-${Date.now()}`;
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input data',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          rule: e.code,
        })),
        correlationId,
      },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  // Never leak internal stack traces or database errors to the client
  const clientMessage = isClientError || env.NODE_ENV !== 'production'
    ? err.message
    : 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (isClientError ? 'CLIENT_ERROR' : 'INTERNAL_SERVER_ERROR'),
      message: clientMessage,
      correlationId,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
