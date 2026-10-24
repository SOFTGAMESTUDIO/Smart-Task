import { env } from './env.js';

export const ollamaConfig = {
  baseUrl: env.OLLAMA_BASE_URL,
  model: env.OLLAMA_MODEL,
  timeoutMs: env.OLLAMA_TIMEOUT_MS,
};

export const checkOllamaStatus = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        reachable: true,
        models: (data.models || []).map((m) => m.name),
      };
    }
    return { reachable: false, models: [], error: `HTTP ${response.status}` };
  } catch (error) {
    return { reachable: false, models: [], error: error.message };
  }
};
