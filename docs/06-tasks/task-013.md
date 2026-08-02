# task-013: Authentication Middleware (JWT + Session Verification)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A3. RBAC Enforcement Middleware  
**Module:** Authentication  
**Priority:** P0 - Blocking

---

## Business Goal

Provide the shared middleware every protected route in every module uses to verify the caller is authenticated before any business logic runs.

## Depends On

- task-007

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-055)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 32 (Authentication Middleware); docs/03-sad/02-system-architecture.md Section 17 (Authorization & RBAC)
- **Design:** N/A

## Required Existing Code

task-005 (middleware pipeline), task-007 (token/session model).

## Backend Scope

- Middleware that validates: JWT signature/expiry, session still active, user still active, user's role still active (AUTH-055), before allowing the request to reach the controller.
- On failure, respond 401 with the standard error envelope; never reach the controller.
- Attach the resolved user/role/permission context to the request for downstream Authorization middleware (task-014) to use.

## Frontend Scope

- None directly -- but the frontend must handle a 401 response by redirecting to login / attempting refresh (see task-008).

## Database Impact

- Read-only lookups against sessions/users/roles per request.

## API Impact

- Applied to every protected route across all modules -- not a route of its own.

## Workflow Impact

Gatekeeper for every authenticated workflow in the system.

## Security Impact

- This IS the primary authentication security boundary -- must reject any request with an invalid, expired, or revoked token/session before business logic executes.

## Testing Required

- Unit test: valid token/session passes through.
- Unit test: expired/invalid/revoked token or inactive user/role is rejected with 401.
- Integration test: applying this middleware to a sample protected route blocks unauthenticated requests.

## Deliverables

- Authentication middleware module, unit + integration tests.

## Acceptance Criteria

- Every documented failure condition (invalid JWT, expired token, revoked session, inactive user, inactive role) results in 401 before controller logic runs.
- A valid request passes through with user context attached.

## Definition of Done

- Implemented, tested, and wired into the app scaffold (task-005) as available middleware for all module routes.

---

## Dependency Detail

- **Blocked By:** task-005, task-007.
- **Required Before:** Every protected endpoint task in Epics B-I.
- **Can Run In Parallel With:** task-014 (Authorization Middleware) can be developed alongside, but Authorization depends on Authentication's output.
