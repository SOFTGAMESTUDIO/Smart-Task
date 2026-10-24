# AI-Powered Smart Task Management Platform

A production-oriented, modular task management application built with **React.js** on the frontend, **Node.js & Express.js** on the backend, and a locally hosted LLM via **Ollama** for intelligent task decomposition, categorization, and explainable priority scoring.

---

## Architecture Highlights

- **Client (`/client`)**: React 18 + Vite, React Router v6, responsive modular design system, decoupled API client with request timeout and error normalization.
- **Server (`/server`)**: Node.js + Express.js (ESM), Zod-validated environment & request schemas, centralized error handler, structured Pino logging, modular feature domains.
- **Local AI Engine**: Self-hosted Ollama backend integration with strict JSON schema parsing, deterministic scoring validation, and human-in-the-loop review.
- **Domain Modules**: Separation for General Tasks, Freelancer/Coder work, Delivery operations, and Priority Rules Engine.

---

## Phase 1: Foundation Status

Phase 1 establishes the monorepo foundation, environment validation, database connectivity abstraction, centralized error management, comprehensive healthcheck endpoint (`/api/v1/health`), and a responsive React application shell.

### Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment files:**
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env`

3. **Start backend server:**
   ```bash
   npm run dev:server
   ```
   Server runs at `http://localhost:5000`. Healthcheck available at `http://localhost:5000/api/v1/health`.

4. **Start frontend client:**
   ```bash
   npm run dev:client
   ```
   Client runs at `http://localhost:5173`.

5. **Run automated test suites:**
   ```bash
   npm test
   ```

---

## Documentation

- [Architecture Overview](file:///c:/Users/Soft%20Game%20Studio/OneDrive/Document/HAckthone/docs/ARCHITECTURE.md)
- [API Specifications](file:///c:/Users/Soft%20Game%20Studio/OneDrive/Document/HAckthone/docs/API.md)
- [Security Model & Guidelines](file:///c:/Users/Soft%20Game%20Studio/OneDrive/Document/HAckthone/docs/SECURITY.md)
- [Development & Contribution Guide](file:///c:/Users/Soft%20Game%20Studio/OneDrive/Document/HAckthone/docs/DEVELOPMENT.md)
