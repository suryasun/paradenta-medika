# task-009: Logout (POST /api/v1/auth/logout)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A1. Login & Token Lifecycle  
**Module:** Authentication  
**Priority:** P1 - High

---

## Business Goal

Allow a user to explicitly end their session, revoking their refresh token and session record.

## Depends On

- task-007

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-045 to AUTH-048)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 16 (Logout Flow)
- **Design:** N/A

## Required Existing Code

task-007 (session created at login).

## Backend Scope

- LogoutUseCase: revoke the current session (AUTH-045), revoke the refresh token (AUTH-046), record a logout activity in the Audit Trail (AUTH-047).
- Access token is allowed to expire naturally -- no blacklist store is defined in the SAD (AUTH-048); do not invent one.
- POST /api/v1/auth/logout controller + DTOs.

## Frontend Scope

- Logout action clearing client-side token storage and calling this endpoint.

## Database Impact

- Updates sessions (revoked_at) and refresh_tokens (revoked).

## API Impact

- Adds POST /api/v1/auth/logout.

## Workflow Impact

Terminates the authenticated session workflow.

## Security Impact

- Session and refresh token must be verifiably unusable after logout (subsequent refresh attempts must fail).

## Testing Required

- Unit test: logout revokes session and refresh token.
- Integration test: a refresh attempt after logout is rejected.

## Deliverables

- LogoutUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Session and refresh token are revoked.
- Audit Trail records the logout event.
- A refresh attempt using the revoked token fails.

## Definition of Done

- Implemented, tested, audit-verified.

---

## Dependency Detail

- **Blocked By:** task-007.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-008, task-010.
