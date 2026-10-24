# System Architecture

## 1. High-Level Overview

The AI-Powered Smart Task Management Platform employs a modular, decoupled client-server architecture designed for reliability, maintainability, and clean separation of concerns.

```text
+-----------------------------------------------------------+
|                   Client (React.js + Vite)               |
|  - Feature Modules (Tasks, Today, Inbox, AI-Plan, Settings)|
|  - Layout Shell & Navigation                              |
|  - Decoupled API Client & Normalized Error Handling       |
+-----------------------------+-----------------------------+
                              | REST JSON (HTTP/HTTPS)
                              v
+-----------------------------------------------------------+
|              Server (Node.js + Express.js - ESM)          |
|  - Input Validation Middleware (Zod schemas)              |
|  - Feature Domain Modules (Auth, Tasks, AI, Categories)   |
|  - Deterministic Priority Engine                          |
|  - Centralized Error & Audit Logging (Pino)               |
+------------------+--------------------+-------------------+
                   |                    |
                   v                    v
      +------------------------+   +------------------------+
      |  Database (MongoDB)    |   | Local LLM (Ollama)     |
      |  - User Preferences    |   | - Strictly backend-only|
      |  - Task Hierarchies    |   | - Structured JSON mode |
      |  - Planning Drafts     |   | - Guardrail validation |
      +------------------------+   +------------------------+
```

## 2. Core Architectural Principles

1. **Separation of AI from Deterministic Logic**:
   - The LLM acts as an assistant for parsing, decomposing, and suggesting.
   - Hard constraints (deadlines, prerequisites, delivery windows, user weights) are enforced by a deterministic rules engine.
   - The LLM is never the sole authority for scheduling or task destruction.

2. **Human-in-the-Loop AI Flow**:
   - Any AI-generated task breakdown or categorization is returned as a **Draft Plan**.
   - No task is committed to the database without explicit user review, edit, or approval.

3. **Feature-Based Modularity**:
   - Both client and server partition code by feature domain (`tasks`, `ai-planning`, `categories`, `priorities`, `delivery`, `freelance`) rather than generic technical buckets.

4. **Security by Default**:
   - Strict schema validation at the HTTP layer using Zod.
   - Ollama LLM requests are strictly originating from the backend server; Ollama is never exposed to the public internet or the frontend.
   - Zero unsanitized dynamic execution or shell commands.

5. **Resilient Offline / Degraded Mode**:
   - If Ollama is unavailable, the user can still create, manage, categorize, and prioritize tasks manually with full fidelity.
