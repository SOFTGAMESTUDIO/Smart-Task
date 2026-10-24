import { env } from '../config/env.js';

const requestCounts = new Map();

export const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const max = options.max || env.RATE_LIMIT_MAX;

  // Cleanup old keys periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.startTime > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, windowMs).unref();

  return (req, res, next) => {
    // In test environment, bypass rate limiting
    if (env.NODE_ENV === 'test') {
      return next();
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(clientIp);

    if (!record || now - record.startTime > windowMs) {
      requestCounts.set(clientIp, {
        count: 1,
        startTime: now,
      });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds: Math.ceil((record.startTime + windowMs - now) / 1000),
        },
      });
    }

    next();
  };
};
