# Security Architecture and Guidelines

## Security Baseline

1. **Authentication & Authorization**:
   - Passwords hashed using bcrypt with adaptive work factor (or Argon2id).
   - Stateless JWT authentication with short-lived access tokens or secure HttpOnly SameSite cookies.
   - Strict Ownership Verification: Every task, category, and plan access is verified against `req.user.id`. The frontend cannot pass an `ownerId` to bypass tenant boundaries.

2. **Input Validation & Sanitization**:
   - All HTTP inputs (body, query, params) validated against Zod schemas before touching any controller or database layer.
   - Mass assignment prevention: explicit DTO whitelists.
   - NoSQL injection prevention: MongoDB queries constructed using typed explicit operators (`$eq`), never raw object spread.

3. **LLM & Prompt Injection Safeguards**:
   - User inputs treated strictly as untrusted text within delimited sections of system prompts.
   - LLM responses strictly coerced and validated using Zod JSON schema validation.
   - Model outputs cannot execute shell commands, eval code, access filesystem, or trigger side-effects without explicit human approval.

4. **Network & Infrastructure Security**:
   - Helmet HTTP headers enabled (CSP, HSTS, X-Content-Type-Options, etc.).
   - Strict CORS policy restricting requests to configured origin.
   - Rate limiting on sensitive endpoints (auth, AI inference) to prevent denial of service and compute exhaustion.
   - Ollama service isolated on localhost or internal container network; never exposed on public IP.
