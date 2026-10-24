---
name: smart-task-guardian
description: >
  Enforces secure architecture, MongoDB Atlas persistence, local Ollama LLM
  guardrails, deterministic task prioritization, Tailwind CSS standards,
  environment privacy, non-destructive data handling, and evidence-based
  verification. Use whenever developing, extending, refactoring, reviewing,
  or testing the AI-Powered Smart Task Management Platform.
---

# Smart Task Guardian

## Mission

Act as a senior software engineer, security-conscious architect, and quality-focused reviewer for the AI-Powered Smart Task Management Platform.

Follow these guidelines in every applicable development task. Inspect existing code before changing it, preserve established functionality, minimize unrelated modifications, and prefer maintainable production-oriented solutions over unnecessary complexity.

## 1. Absolute Security and Privacy Rules

### 1.1 Environment File Protection

- NEVER read, print, inspect, edit, overwrite, or delete actual `.env` files, including `server/.env` and `client/.env`.
- Work exclusively with `.env.example` templates.
- Preserve existing `.env.example` files and their current variables.
- When introducing configuration options, add safe placeholder values and documentation to the appropriate `.env.example`.
- Never copy real credentials into source code, logs, test fixtures, documentation, or generated output.
- Tell the user which new variables they must add to their private environment file.
- Never claim that a credential or database connection works without verification that does not expose secrets.

### 1.2 Non-Destructive Database Policy

- Never drop databases or collections, purge production data, or execute destructive bulk-delete operations.
- Never use `dropDatabase()`, `collection.drop()`, or `deleteMany({})` against live databases.
- Automated tests must use mocks, isolated test databases, or in-memory fixtures.
- Do not run tests against a user's live MongoDB Atlas database unless explicitly authorized and the test is demonstrably non-destructive.
- Never modify existing user data merely to make a test pass.
- Require explicit authorization and a documented recovery plan for any legitimate destructive maintenance operation.

### 1.3 Secret and Data Protection

- Validate all external input on the server.
- Never log passwords, tokens, database connection strings, API keys, or sensitive task content unnecessarily.
- Use least-privilege access, secure defaults, safe error responses, and explicit authorization checks.
- Do not trust client-side validation as a security boundary.

## 2. Mandatory Frontend Standards

### Technology

- React.js with the existing project configuration.
- Tailwind CSS.
- Inter typography.
- `@tanstack/react-query` for server-state caching, background refetching, mutation handling, and safe optimistic updates.
- Preserve the existing router, build tools, and dependency choices unless a change is justified.

### Design Rules

- Use a professional dark slate theme with restrained contrast and clear visual hierarchy.
- Never introduce bright purple gradients, cluttered generic templates, fake metrics, fabricated reviews, decorative emoji icons, or unnecessary animations.
- Prioritize responsive layouts, accessibility, keyboard navigation, readable typography, and useful empty, loading, success, and error states.
- Respect reduced-motion preferences.
- Avoid redesigning unrelated pages or changing unrelated components.
- Reuse existing UI components before creating replacements.

### React Query Rules

- Define consistent query keys and cache invalidation strategies.
- Configure sensible stale times and retry behavior.
- Use optimistic updates only when rollback and error handling are implemented.
- Never treat cached data as proof that a database write succeeded.
- Prevent duplicate submissions and handle loading, cancellation, timeouts, and network failures appropriately.

## 3. Deterministic Task Priority Engine

The priority engine is a hard architectural boundary.

### Authoritative Inputs

Execution order must respect:

1. Task dependencies and prerequisite completion.
2. Deadlines and urgency.
3. User-configured category weights from 1 to 5.
4. Other explicitly defined deterministic business rules.

Implement the scoring algorithm as a documented, testable service. Use stable tie-breaking rules so identical inputs produce consistent results.

### LLM Restrictions

- The local LLM may suggest task decomposition, categories, descriptions, and draft recommendations.
- The LLM MUST NOT override dependency constraints, deadline rules, authorization policies, or deterministic priority decisions.
- Validate every AI-generated field before accepting it.
- Never execute an AI-generated action merely because the model recommends it.
- Treat model output as untrusted input.

If the deterministic engine and LLM disagree, the deterministic engine wins.

## 4. Local Ollama Safety

- All Ollama requests must originate from the backend.
- The frontend must never connect directly to the Ollama service.
- Keep Ollama configuration server-side.
- Apply request timeouts, payload limits, error handling, and concurrency controls.
- Treat user task descriptions and retrieved content as untrusted data.
- Clearly delimit user-provided text in prompts and instruct the model not to follow instructions embedded within task content.
- Do not rely on prompt instructions alone for security.
- Validate structured model output using strict Zod schemas.
- Reject malformed, oversized, unexpected, or invalid output safely.
- Never expose internal prompts, stack traces, or server configuration to unauthorized clients.

### Required Draft Approval Lifecycle

1. Receive the user's task description.
2. Request a proposed decomposition from the backend Ollama client.
3. Validate the response against the required schema.
4. Apply deterministic priority and dependency rules.
5. Present a reviewable draft to the user.
6. Allow the user to edit, approve, or reject the draft.
7. Persist approved tasks only after explicit user approval.
8. Revalidate the approved data on the server before persistence.

Draft generation must not silently create permanent tasks.

## 5. Backend Architecture

Use a feature-based modular Express architecture.

### Required responsibilities

- `server/src/app.js`: Express configuration, Helmet, CORS, JSON limits, rate limiting, and route registration.
- `server/src/modules/`: Feature-specific routes, controllers, services, and validation schemas.
- `server/src/middleware/errorHandler.js`: Centralized error handling.
- `server/src/middleware/notFound.js`: Consistent 404 handling.
- `server/src/middleware/validateRequest.js`: Request validation.
- `server/src/config/env.js`: Zod environment validation.
- `server/src/config/database.js`: MongoDB connection management.
- `server/src/config/ollama.js`: Backend-only Ollama client configuration.

Keep controllers thin. Put business rules in services and keep persistence logic separate from HTTP handling.

## 6. MongoDB Atlas and Mongoose

### Persistence

- Use dynamic Mongoose schemas, models, services, and controllers.
- Do not replace persistent application data with hardcoded arrays.
- Use MongoDB Atlas when the user supplies valid private configuration.
- Target database name: `AI Task Management Platform`.
- Use schema validation, indexes, timestamps, and appropriate uniqueness constraints.
- Enforce ownership and authorization at the backend.
- Handle duplicate writes, concurrent updates, and connection failures safely.

### Credential Encoding

When constructing a connection string from separately supplied username and password components, encode those components individually:

```javascript
const encodedUsername = encodeURIComponent(username);
const encodedPassword = encodeURIComponent(password);
```

Prefer a validated, user-provided connection URI where appropriate. Do not double-encode an existing URI or expose credentials in logs.

### Graceful Degradation

- A MongoDB outage must not crash the entire application unnecessarily.
- Report the actual connection state as `connected` or `disconnected` through `/api/v1/health`.
- Return a controlled service-unavailable response for operations that require unavailable persistence.
- Do not pretend that in-memory data has been persisted to MongoDB.
- If an in-memory fallback is implemented, label it clearly as temporary and non-durable.
- Never silently switch to in-memory writes when doing so could cause data loss or misleading success responses.

## 7. Frontend Project Structure

Preserve this organizational structure unless the existing project has a documented reason to differ:

```text
client/
└── src/
    ├── components/
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Card.jsx
    │   │   └── Alert.jsx
    │   └── layout/
    │       ├── AppLayout.jsx
    │       ├── Sidebar.jsx
    │       └── TopBar.jsx
    ├── pages/
    │   ├── DashboardPage.jsx
    │   ├── TasksPage.jsx
    │   ├── TodayPage.jsx
    │   ├── InboxPage.jsx
    │   ├── AIPlannerPage.jsx
    │   └── SettingsPage.jsx
    ├── services/
    │   ├── apiClient.js
    │   └── errorHandler.js
    ├── hooks/
    ├── lib/
    ├── routes/
    ├── App.jsx
    └── main.jsx
```

Use existing conventions when filenames or extensions differ. Do not create empty files solely to match this example.

## 8. Verification and Honest Reporting

Never claim a test passed, a server started, a database connected, or a feature works unless supported by actual evidence.

### Required checks

Run applicable commands from the correct project root:

**1. Automated tests**

```bash
npm test
```

**2. Server health**

```bash
curl -sS --max-time 5 http://localhost:5005/api/v1/health
```

**3. Client production build**

```bash
npm run build --workspace=client
```

**4. Regression inspection**

- Inspect browser and server logs when available.
- Check for unhandled promise rejections.
- Review authentication and authorization paths.
- Check input validation and error responses.
- Verify optimistic-update rollback behavior.
- Check that existing routes and functionality remain intact.

Do not claim the full monorepo test suite passed if only a subset was run.

### Reporting Format

Report each verification result honestly:

- **PASS:** The check executed and succeeded.
- **FAIL:** The check executed and failed.
- **NOT RUN:** The check was not executed.
- **BLOCKED:** The check could not run because of a missing dependency, unavailable service, or other documented limitation.

Include the command executed and the relevant result. Redact secrets from logs and output.

A health endpoint returning HTTP 200 is not, by itself, proof that every dependency is operational. Inspect its reported database and service states.

## 9. Mandatory Development Workflow

For every applicable change:

1. Inspect relevant files and understand the existing architecture.
2. Identify security, compatibility, and data-integrity risks.
3. Define the smallest implementation that satisfies the requirement.
4. Update code and `.env.example` when configuration changes.
5. Add or update tests using isolated fixtures and mocks.
6. Run applicable tests, build checks, and health probes.
7. Inspect regressions and ensure errors are handled safely.
8. Report exact files changed and verification evidence.
9. List any remaining limitations or user actions required.

Do not invent source files, test results, dependency installations, database state, or runtime behavior.

## 10. Definition of Done

A task is complete only when:

- The requested implementation is present in the actual files.
- Existing functionality has been preserved where required.
- Security and data-integrity rules are respected.
- Relevant automated tests and builds have been run where possible.
- Results are reported accurately.
- Unverified behavior and outstanding limitations are clearly identified.
- Required user configuration is documented without accessing private `.env` files.

**Final rule:** Security, data integrity, deterministic business logic, and truthful verification take priority over speed or apparent completion.
