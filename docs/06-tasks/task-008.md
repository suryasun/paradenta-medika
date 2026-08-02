# task-008: Refresh Token (POST /api/v1/auth/refresh)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A1. Login & Token Lifecycle  
**Module:** Authentication  
**Priority:** P0 - Blocking

---

## Business Goal

Allow a client holding a valid refresh token to obtain a new access token without re-entering credentials, keeping sessions alive without weakening security.

## Depends On

- task-007

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (Refresh Token Policy section)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 13 (Refresh Token), Section 14 (Token Rotation Strategy)
- **Design:** N/A

## Required Existing Code

task-007 (session/refresh token created at login).

## Backend Scope

- RefreshTokenUseCase: validate the presented refresh token against the session store, verify it is not expired/revoked/reused.
- Issue a new access token (and, if token rotation is enabled, a new refresh token, invalidating the old one) per docs/03-sad/10-authentication.md Section 14.
- POST /api/v1/auth/refresh controller + DTOs.

## Frontend Scope

- Axios/React Query interceptor that calls this endpoint automatically on a 401 due to access-token expiry, then retries the original request.

## Database Impact

- Reads/updates the sessions / refresh_tokens table (rotation, revocation).

## API Impact

- Adds POST /api/v1/auth/refresh.

## Workflow Impact

Keeps a logged-in user's session usable across the access-token expiry window without forcing re-login.

## Security Impact

- Refresh token reuse detection must revoke the session (AUTH-054: session revoked on refresh-token reuse detection).

## Testing Required

- Unit test: valid refresh token issues a new access token.
- Unit test: expired/revoked refresh token is rejected with 401.
- Unit test: reused (already-rotated) refresh token triggers session revocation.

## Deliverables

- RefreshTokenUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- A valid, non-expired refresh token yields a new access token.
- An expired or revoked refresh token is rejected.
- Refresh token reuse revokes the associated session.

## Definition of Done

- Implemented and tested per Acceptance Criteria.
- Conforms to response envelope.

---

## Dependency Detail

- **Blocked By:** task-007.
- **Required Before:** Frontend long-lived session usage (not strictly blocking other backend tasks).
- **Can Run In Parallel With:** task-009, task-010 (Logout, Change Password) -- same module, independent endpoints.
