import { normalizeError, AppError } from './errorHandler.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;

export async function request(endpoint, { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    signal: controller.signal,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorPayload = isJson && data?.error ? data.error : {};
      throw new AppError(errorPayload.message || `HTTP request failed with status ${response.status}`, {
        code: errorPayload.code || `HTTP_${response.status}`,
        status: response.status,
        details: errorPayload.details || [],
      });
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw normalizeError(error);
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),

  // System & Health
  checkHealth: () => request('/health', { method: 'GET', timeout: 5000 }),

  // Dynamic Tasks API
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getTaskById: (id) => request(`/tasks/${id}`, { method: 'GET' }),
  createTask: (data) => request('/tasks', { method: 'POST', body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  completeTask: (id) => request(`/tasks/${id}/complete`, { method: 'POST' }),
  deleteTask: (id, permanent = false) => request(`/tasks/${id}${permanent ? '?permanent=true' : ''}`, { method: 'DELETE' }),
  cancelTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getTodayTasks: () => request('/tasks/today', { method: 'GET' }),

  // Categories & Priorities API
  getCategories: () => request('/categories', { method: 'GET' }),
  updateCategoryWeight: (id, weight) => request(`/categories/${id}`, { method: 'PATCH', body: { weight } }),

  // AI Decomposition API (120s timeout for local LLM inference)
  getAIStatus: () => request('/ai/status', { method: 'GET', timeout: 5000 }),
  decomposeTask: (taskDescription, model) =>
    request('/ai/decompose', { method: 'POST', body: { taskDescription, model }, timeout: 120000 }),
  approveDecomposition: (originalInput, subtasks) =>
    request('/ai/approve', { method: 'POST', body: { originalInput, subtasks }, timeout: 30000 }),
};

export default apiClient;
