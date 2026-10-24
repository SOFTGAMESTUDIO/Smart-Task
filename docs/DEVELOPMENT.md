# Development Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or Docker container running on port 27017
- **Ollama**: Local Ollama runtime running on port 11434 (`ollama run llama3:8b` or `mistral`)

---

## Workspace Setup

1. **Clone & Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Environment Configuration**:
   ```bash
   # Server environment
   cp server/.env.example server/.env

   # Client environment
   cp client/.env.example client/.env
   ```

3. **Running Docker Services (Optional)**:
   ```bash
   docker-compose up -d mongodb ollama
   ```

4. **Running Locally**:
   ```bash
   # Run both server & client concurrently
   npm run dev

   # Or run individually:
   npm run dev:server
   npm run dev:client
   ```

5. **Running Automated Tests**:
   ```bash
   npm test
   ```
