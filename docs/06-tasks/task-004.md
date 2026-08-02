# task-004: Environment & Secret Configuration

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** J. Foundational Infrastructure  
**Feature:** J1. Database & Environment Setup  
**Module:** Cross-Cutting / Configuration  
**Priority:** P0 - Blocking

---

## Business Goal

Provide a single, documented source of environment configuration (DB connection, JWT secrets, storage) so that no credential is hardcoded, per Configuration Management principles.

## Depends On

- None (can start once foundational infrastructure tasks are complete)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/business-rules.md (Cross-Cutting Rules section)
- **SAD:** docs/03-sad/02-system-architecture.md Section 22 (Configuration Management), docs/03-sad/10-authentication.md Section 42 (Environment Configuration)
- **Design:** N/A

## Required Existing Code

None.

## Backend Scope

- Define .env.example with: APP_NAME, APP_PORT, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY, S3_ENDPOINT, S3_BUCKET, SMTP_HOST (per docs/03-sad/02-system-architecture.md Section 22.4).
- Implement a Configuration Service that loads and validates environment variables at startup (fail fast if a required variable is missing).
- Bcrypt salt rounds default = 12 per docs/04-ai-contract/05-auth-contract.md AUTH-065, must be configurable via environment.

## Frontend Scope

- Define NEXT_PUBLIC_API_BASE_URL and any other frontend-safe env vars in .env.example for the Next.js app.

## Database Impact

- None -- DATABASE_URL is configuration, not schema.

## API Impact

- None.

## Workflow Impact

No direct business workflow; this is a prerequisite for every service that needs configuration (Auth, Storage, Email).

## Security Impact

- No hardcoded credentials anywhere in source (docs/03-sad/02-system-architecture.md Section 22.5).
- Secrets must never be committed to version control -- .env must be gitignored, only .env.example committed.

## Testing Required

- Unit test for the Configuration Service asserting it throws/fails fast when a required variable is absent.

## Deliverables

- Configuration Service module.
- .env.example file.
- README section documenting each variable.

## Acceptance Criteria

- Application fails to start with a clear error message if any required environment variable is missing.
- No secret value is hardcoded anywhere in the codebase.

## Definition of Done

- Configuration Service implemented and unit tested.
- .env.example committed with every variable documented.

---

## Dependency Detail

- **Blocked By:** None.
- **Required Before:** task-005 (App Scaffold), task-007 (Login -- needs JWT_SECRET).
- **Can Run In Parallel With:** task-003 (Database Migration).
