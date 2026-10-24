# API Specifications (v1)

Base URL: `/api/v1`

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must be at least 3 characters"
      }
    ]
  }
}
```

---

## Endpoints

### 1. System Health
- **`GET /api/v1/health`**
  - **Description**: Returns server status, uptime, environment, and dependency connectivity status (MongoDB, Ollama).
  - **Auth**: Public
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "status": "healthy",
        "timestamp": "2026-10-24T12:00:00.000Z",
        "uptime": 142.5,
        "environment": "development",
        "services": {
          "database": "connected",
          "ollama": "reachable"
        }
      }
    }
    ```

### 2. Authentication (Phase 2)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### 3. Tasks Management (Phase 2)
- `GET /api/v1/tasks` (Supports filters: `status`, `categoryId`, `priority`, `search`)
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/:taskId`
- `PATCH /api/v1/tasks/:taskId`
- `DELETE /api/v1/tasks/:taskId`
- `POST /api/v1/tasks/:taskId/complete`

### 4. AI Planning & Decomposition (Phase 3)
- `POST /api/v1/ai/plan` (Body: `{ "taskInput": "..." }`)
- `POST /api/v1/ai/plan/:planId/approve`
- `POST /api/v1/ai/plan/:planId/reject`
- `POST /api/v1/ai/plan/:planId/regenerate`

### 5. Categories & Priorities (Phase 2 & 4)
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/preferences/priorities`
- `PUT /api/v1/preferences/priorities`
