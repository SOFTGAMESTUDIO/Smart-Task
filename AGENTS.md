# Smart Task Management Platform - Engineering & Architecture Rules

This workspace houses the **AI-Powered Smart Task Management Platform**. All AI agents operating in this repository must strictly adhere to the following rules:

---

## ⚠️ STRICT ENVIRONMENT & DATABASE RESTRICTIONS (USER-DEFINED MANDATORY)

1. **NEVER Access, Read, or Edit `.env` Files**:
   - The agent is STRICTLY PROHIBITED from reading, modifying, creating, or overwriting `.env` files.
   - ONLY the USER can view or edit `.env` with their personal credentials.
   - The agent MUST ONLY inspect or update `.env.example` / `sample.env` templates.
   - If any new environment variable or configuration change is required, the agent MUST ONLY document it in `.env.example` and clearly notify the user.

2. **NEVER Delete or Purge Database Data**:
   - The agent is STRICTLY PROHIBITED from executing destructive database operations (`dropDatabase`, `dropCollection`, `deleteMany({})`, purging records).
   - Automated tests MUST use isolated mock data or dedicated in-memory test fixtures so original/live data is never modified or affected.
   - The USER connects the live MongoDB Atlas database and local Ollama LLM directly.

---

## 1. Core Architectural Separation

- **Human-in-the-Loop AI**: AI-generated task decompositions, categories, and estimates MUST remain in draft state until explicitly reviewed, edited, or approved by the user.
- **Deterministic Priority Engine**: The local LLM is an assistant for decomposition and categorization suggestions. It MUST NOT be the sole authority for scheduling or priority decisions. Hard deadlines, user-configured category weights (1–5), urgency, and prerequisite dependencies take deterministic precedence.
- **Backend-Only AI Execution**: Ollama inference requests MUST strictly originate from the Node.js backend. Never expose Ollama endpoints to the public or client.

---

## 2. Tech Stack & Styling Standards

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide React, and TanStack React Query (`@tanstack/react-query`) for blazing-fast response caching and optimistic UI.
- **Backend**: Node.js & Express.js with ES Modules (`"type": "module"`).
- **Validation**: Strict schema validation with Zod for all request payloads (`body`, `query`, `params`) and LLM JSON outputs.
- **Database**: MongoDB / MongoDB Atlas via Mongoose with encoded connection parameters (`encodeURIComponent`). Database connectivity must remain resilient with non-blocking fallback if disconnected.
- **Ports & Environment**:
  - Backend Port: `5005` (Health check at `/api/v1/health`)
  - Frontend Port: `5173` (Vite dev server with `/api` proxy to port `5005`)

---

## 3. Database Credentials & Atlas Security

- When using MongoDB Atlas, always URL-encode `username` and `password` with `encodeURIComponent` to prevent connection errors caused by special characters.
- Database name defaults to `"AI Task Management Platform"`.
- Never commit active credentials into version control. Keep `.env` git-ignored and document variables in `.env.example`.

---

## 4. Coding & Verification Checklist

Before completing any task or claiming verification:
1. Ensure both frontend and backend automated tests pass (`npm test`).
2. Verify that all imports/exports are complete and valid ES Modules.
3. Verify that error responses conform to `{ success: false, error: { code, message, details } }`.
4. Ensure dark productivity aesthetics (slate backgrounds, restrained blue/indigo accents, crisp typography) are maintained.
