# task-012: Reset Password (POST /api/v1/auth/reset-password)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A2. Password Recovery  
**Module:** Authentication  
**Priority:** P2 - Medium

---

## Business Goal

Allow a user holding a valid password-reset token to set a new password and regain account access.

## Depends On

- task-011

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-072 to AUTH-076)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 20 (Forgot Password)
- **Design:** N/A

## Required Existing Code

task-011 (reset token issuance).

## Backend Scope

- ResetPasswordUseCase: validate the token (exists, not expired, not used), validate new password against policy, hash and persist, mark token as used, revoke all existing sessions (AUTH-075), record Audit Trail (AUTH-076).
- POST /api/v1/auth/reset-password controller + DTOs.

## Frontend Scope

- Reset Password page (token from URL/link + new password + confirm) with policy hinting.

## Database Impact

- Updates users.password_hash; marks password_reset_tokens row used; revokes sessions.

## API Impact

- Adds POST /api/v1/auth/reset-password.

## Workflow Impact

Completes the password-recovery workflow started by task-011.

## Security Impact

- Token single-use enforced (reject reuse).
- All sessions revoked after reset (AUTH-075).

## Testing Required

- Unit test: valid unexpired token + policy-compliant password succeeds.
- Unit test: expired/used token is rejected.
- Unit test: policy-violating password is rejected.

## Deliverables

- ResetPasswordUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Valid token + compliant password resets the password and revokes all sessions.
- Expired/used/invalid token is rejected with a clear error.
- Audit Trail entry created.

## Definition of Done

- Implemented and tested per Acceptance Criteria.

---

## Dependency Detail

- **Blocked By:** task-011.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-008, task-009, task-010.
