# task-005: Backend Application Scaffold (Express + Middleware Pipeline)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** J. Foundational Infrastructure  
**Feature:** J1. Database & Environment Setup  
**Module:** Cross-Cutting / Framework  
**Priority:** P0 - Blocking

---

## Business Goal

Stand up the base Express.js application with the standard middleware pipeline (logging, JWT auth, error handling) so every module's controllers can be mounted on a consistent, contract-compliant foundation.

## Depends On

- task-004 (Environment & Secret Configuration)

## Required Documents

- **AI Contract:** docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/04-api-contract.md
- **PRD:** docs/01-prd/business-rules.md (Cross-Cutting Rules section)
- **SAD:** docs/03-sad/02-system-architecture.md Section 15 (Request Lifecycle), Section 19 (Exception Handling), Section 21 (Logging Architecture)
- **Design:** N/A

## Required Existing Code

task-004 output (Configuration Service).

## Backend Scope

- Express app bootstrap with modular monolith folder structure per docs/04-ai-contract/03-project-structure-contract.md.
- Global middleware pipeline: request logger (with Correlation ID per docs/03-sad/03-clean-architecture.md Section 36.4) -> JSON body parser -> CORS -> (per-route) Authentication middleware -> (per-route) Authorization middleware -> centralized Exception Handler.
- Centralized Exception Handler mapping the exception hierarchy in docs/03-sad/03-clean-architecture.md Section 38.2 to HTTP status codes per Section 38.5.
- Standard success/error response envelope helper per docs/04-ai-contract/04-api-contract.md Response Schema.
- Health check endpoints: GET /health, GET /health/database, GET /health/storage per docs/03-sad/02-system-architecture.md Section 36.2.

## Frontend Scope

- None -- backend-only task.

## Database Impact

- GET /health/database performs a lightweight DB connectivity check; no schema change.

## API Impact

- Adds GET /health, GET /health/database, GET /health/storage.
- Establishes the response envelope every subsequent endpoint must use.

## Workflow Impact

No business workflow directly; this is the runtime skeleton every module controller mounts onto.

## Security Impact

- CORS configured to the documented frontend origin only.
- Helmet-equivalent security headers applied per docs/03-sad/10-authentication.md Section 34 (Security Headers).

## Testing Required

- Integration test: server boots and GET /health returns 200 with the standard envelope.
- Integration test: an unhandled exception thrown by a route is caught and returns the standard error envelope, not a stack trace.

## Deliverables

- Express app entrypoint.
- Middleware modules (logger, error handler, response envelope helper).
- Health check routes.

## Acceptance Criteria

- Server starts successfully using the Configuration Service from task-004.
- Every error response (400/401/403/404/409/422/500) uses the exact envelope in docs/03-sad/02-system-architecture.md Section 19.4.
- No raw stack trace, SQL error, or Prisma error is ever returned to the client (docs/03-sad/03-clean-architecture.md Section 38.4).

## Definition of Done

- Scaffold implemented, health checks pass locally.
- Exception handler unit/integration tested for each mapped exception type.

---

## Dependency Detail

- **Blocked By:** task-004.
- **Required Before:** Every controller/route task in Epics A-I.
- **Can Run In Parallel With:** task-003 (Database Migration) -- different concern, can run in parallel once task-004 is done.
