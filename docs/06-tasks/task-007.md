# task-007: Login (POST /api/v1/auth/login)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A1. Login & Token Lifecycle  
**Module:** Authentication  
**Priority:** P0 - Blocking

---

## Business Goal

Allow a registered user to authenticate with username/email and password and receive access + refresh tokens, unblocking every other authenticated endpoint in the system.

## Depends On

- task-003
- task-004
- task-005
- task-006

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-038 to AUTH-044)
- **PRD:** docs/01-prd/vision.md, docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 8 (Login Flow), Section 9 (Token Architecture); docs/03-sad/09-api-standard.md Section 50 (POST /api/v1/auth/login)
- **Design:** N/A (no login page design spec in docs/02-design/ -- see docs/02-design/pages/overview.md gap note; a basic login form should follow the frontend rules in CLAUDE.md until a design spec exists)

## Required Existing Code

task-003 (users table), task-004 (JWT_SECRET config), task-005 (app scaffold, response envelope), task-006 (Audit Trail for failed-login recording).

## Backend Scope

- LoginUseCase: accept username-or-email + password (AUTH-038).
- Find user, verify password hash, verify active status, verify active role, verify account not locked (AUTH-039).
- On success: generate access token + refresh token + create session record, return both tokens + expiration + user profile + role + permission summary (AUTH-040, AUTH-041).
- On failure: increment failed-login counter, create audit login event, return a generic error that does not reveal which factor failed (AUTH-042, AUTH-043, AUTH-044).
- POST /api/v1/auth/login controller + request DTO (identifier, password) + response DTO.

## Frontend Scope

- Login page/form with username-or-email + password fields, calling POST /api/v1/auth/login, storing the returned tokens per the frontend auth-state strategy (Zustand, per docs/03-sad/02-system-architecture.md Appendix A.1).

## Database Impact

- Writes to users (failed_login_count increment) and sessions (new session row) on success/failure.

## API Impact

- Adds POST /api/v1/auth/login.

## Workflow Impact

This is the entry point of every authenticated user workflow; no other Phase 1 endpoint is reachable without it.

## Security Impact

- Passwords compared via bcrypt hash, never plaintext (AUTH-064, AUTH-066).
- Generic failure message -- must not reveal whether username, password, or lock state caused the failure (AUTH-044).
- Failed login increments a counter feeding the account-lock policy (task-013 dependency: 5 failed attempts -> 15 min lock per AUTH-068).

## Testing Required

- Unit test: LoginUseCase with valid credentials returns tokens.
- Unit test: LoginUseCase with invalid password returns generic error and increments failed-login counter.
- Integration test: POST /api/v1/auth/login end-to-end against a seeded user.

## Deliverables

- LoginUseCase, controller, route, request/response DTOs.
- Unit + integration tests.

## Acceptance Criteria

- Valid credentials return access token, refresh token, expiry, user profile, role, and permission summary (AUTH-041).
- Invalid credentials return a generic error message and HTTP 401, with no indication of which factor failed.
- A session record is created in the database on successful login.
- An audit event is recorded on both success and failure.

## Definition of Done

- Endpoint implemented, tested, and conforms to the response envelope in docs/04-ai-contract/04-api-contract.md.
- Audit Trail entries verified for both success and failure paths.

---

## Dependency Detail

- **Blocked By:** task-003, task-004, task-005, task-006.
- **Required Before:** Every task requiring an authenticated user (effectively all of Epics B-I).
- **Can Run In Parallel With:** task-021 through task-026 (Master Data CRUD) once task-006 is done -- different module, no shared code path.
