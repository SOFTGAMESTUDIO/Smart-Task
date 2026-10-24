export class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', status = 500, details = [] } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const normalizeError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (error.name === 'AbortError') {
    return new AppError('The request timed out. Please check your connection and try again.', {
      code: 'REQUEST_TIMEOUT',
      status: 408,
    });
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('Unable to connect to the server. Please verify backend service is running.', {
      code: 'NETWORK_ERROR',
      status: 503,
    });
  }

  return new AppError(error.message || 'An unexpected error occurred.', {
    code: 'UNKNOWN_ERROR',
    status: 500,
  });
};
