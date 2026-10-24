import { env } from '../../config/env.js';

const OLLAMA_BASE = env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = env.OLLAMA_MODEL || 'qwen2.5-coder:latest';
const TIMEOUT_MS = env.OLLAMA_TIMEOUT_MS || 60000;

// ─── Ollama Health Check ────────────────────────────────────────────────────
export const checkOllamaHealth = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { reachable: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m) => m.name);
    return { reachable: true, models, activeModel: DEFAULT_MODEL };
  } catch {
    clearTimeout(timer);
    return { reachable: false, models: [], activeModel: DEFAULT_MODEL };
  }
};

// ─── Task Decomposition via Ollama ─────────────────────────────────────────
export const decomposeTaskWithOllama = async (taskDescription, requestedModel) => {
  const modelToUse = requestedModel || DEFAULT_MODEL;

  const systemPrompt = `You are a productivity AI assistant. Your ONLY job is to decompose a user's task description into structured subtasks with distinct deadlines.

RESPONSE FORMAT (JSON only, no markdown, no preamble):
{
  "suggestedCategory": "<one of: Freelance Coding | Office Work | Delivery Assignments | Education | Personal Errands & Shopping | Home & Family Responsibilities | Other>",
  "explanation": "<one sentence explaining the decomposition logic>",
  "estimatedTotalMinutes": <number>,
  "subtasks": [
    {
      "title": "<clear action title>",
      "category": "<same category options>",
      "priority": "<Critical | High | Medium | Low>",
      "estimatedMinutes": <number>,
      "deadline": "<e.g. Today 5:00 PM | Tomorrow morning | In 3 days | In 5 days | Flexible>",
      "dueDays": <number of days from now for deadline: 0 for today, 1 for tomorrow, 2 for 2 days, 5 for 5 days, etc.>,
      "dependencies": "<None | name of blocking subtask>"
    }
  ]
}

Rules:
- Output ONLY valid JSON.
- Decompose into 2–7 atomic, actionable subtasks.
- If user mentions specific timeframes (e.g. "task 1 today, task 2 in 5 days"), assign distinct dueDays and deadlines (e.g. 0 for today, 5 for 5 days).
- Assign priority based on urgency keywords.
- Keep estimatedMinutes realistic (5–180 per subtask).`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelToUse,
        format: 'json',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Decompose this task into actionable subtasks with clear deadlines: "${taskDescription}"` },
        ],
        stream: false,
        options: { temperature: 0.2, top_p: 0.9 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Ollama returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const raw = data?.message?.content || '';

    // Extract JSON block from model output
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
    let jsonStr = (jsonMatch[1] || raw).trim();

    // In case there is text before or after JSON
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      throw new Error('Invalid LLM response: missing subtasks array');
    }

    return {
      success: true,
      model: modelToUse,
      suggestedCategory: parsed.suggestedCategory || 'Other',
      explanation: parsed.explanation || '',
      estimatedTotalMinutes: parsed.estimatedTotalMinutes || 0,
      subtasks: parsed.subtasks.map((s, i) => {
        let dueDays = 0;
        if (typeof s.dueDays === 'number') {
          dueDays = s.dueDays;
        } else if (s.deadline?.toLowerCase().includes('today')) {
          dueDays = 0;
        } else if (s.deadline?.toLowerCase().includes('tomorrow')) {
          dueDays = 1;
        } else {
          const matchDays = s.deadline?.match(/(\d+)\s*day/i);
          dueDays = matchDays ? parseInt(matchDays[1], 10) : (i === 0 ? 0 : i <= 2 ? 1 : 5);
        }

        const dueAt = new Date(Date.now() + dueDays * 24 * 3600 * 1000).toISOString();
        const readableDeadline = s.deadline || (dueDays === 0 ? 'Due Today' : dueDays === 1 ? 'Due Tomorrow' : `Due in ${dueDays} days`);

        return {
          id: `ai-${Date.now()}-${i}`,
          title: s.title || 'Untitled subtask',
          category: s.category || parsed.suggestedCategory || 'Other',
          priority: ['Critical', 'High', 'Medium', 'Low'].includes(s.priority) ? s.priority : 'Medium',
          estimatedMinutes: Number(s.estimatedMinutes) || 30,
          deadline: readableDeadline,
          dueDays,
          dueAt,
          dependencies: s.dependencies || 'None',
          status: 'Proposed',
        };
      }),
    };
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${TIMEOUT_MS / 1000}s. Ensure Ollama is running and model "${modelToUse}" is loaded.`);
    }
    if (err instanceof SyntaxError) {
      throw new Error('LLM returned invalid JSON. Try rephrasing your task or check model compatibility.');
    }
    throw err;
  }
};
