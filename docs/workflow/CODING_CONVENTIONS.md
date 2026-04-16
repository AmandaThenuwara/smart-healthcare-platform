# Coding Conventions

## Backend
- Use FastAPI for all services
- Use `app/api/routes` for route files
- Use `app/api/router.py` to combine routes
- Use `/api/v1` as the version prefix
- Use `snake_case` for Python files
- Keep route logic light, move heavy logic into `app/services`

## Frontend
- Use React + TypeScript
- Use `modules`-based structure for features
- Use `PascalCase` for components
- Use `camelCase` for variables and functions

## Git
- Work from feature branches only
- Never commit directly to `main`
- Open PRs into `develop`

## Environment
- Never commit `.env`
- Commit only `.env.example`

## Service naming
- auth-service
- patient-service
- doctor-service
- appointment-service
- telemedicine-service
- payment-service
- notification-service
- ai-symptom-service
- gateway

## API naming
- `/api/v1/...`
- Keep responses JSON-based