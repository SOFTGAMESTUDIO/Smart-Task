# Project Coding Guidelines & Behavioral Rules

- **Privacy & Safety - NEVER TOUCH `.env`**: The agent MUST NEVER view, edit, or modify `.env` files. Only the USER manages live credentials. The agent works exclusively with `.env.example` templates and informs the user of any needed variables.
- **Data Protection - NEVER DELETE LIVE DATA**: Destructive database operations (`dropDatabase`, `deleteMany`, purging live collections) are strictly prohibited. Tests use mock fixtures to guarantee original user data is never modified.
- **Framework & CSS**: Use Tailwind CSS with dark-mode slate theme and modern typography (Inter). Do not create bright purple or cluttered generic templates.
- **Fast Response**: Cache API responses with `@tanstack/react-query` to provide immediate screen transitions and optimistic updates.
- **Deterministic Priority Engine**: Deadlines, user category weights (1 to 5), and task dependencies govern execution order. The local LLM never overwrites hard rules.
- **Zero Hallucination of Verification**: Never claim a test passed, server ran, or database connected unless actually verified via commands or health probes.
- **Safe Environment**: Always preserve `.env.example` when adding configuration options.
