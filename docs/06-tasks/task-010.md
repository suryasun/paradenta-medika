# task-010: Change Password (POST /api/v1/auth/change-password)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A1. Login & Token Lifecycle  
**Module:** Authentication  
**Priority:** P1 - High

---

## Business Goal

Allow an authenticated user to change their own password, enforcing the documented password policy.

## Depends On

- task-007

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-056 to AUTH-067, AUTH-074, AUTH-076)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 17 (Password Policy), Section 18 (Password Hashing)
- **Design:** N/A

## Required Existing Code

task-007 (authenticated session context).

## Backend Scope

- ChangePasswordUseCase: verify current password, validate new password against policy (8-64 chars, upper/lower/number/special, not equal to username/email, not containing user's name, not a common password) per AUTH-056 to AUTH-061.
- Hash new password with bcrypt (salt rounds from config, default 12).
- Revoke all existing sessions on successful change (AUTH-074).
- Record the activity in the Audit Trail (AUTH-076).
- POST /api/v1/auth/change-password controller + DTOs.

## Frontend Scope

- Change Password form (current password, new password, confirm new password) with client-side policy hinting mirroring the backend rule.

## Database Impact

- Updates users.password_hash; revokes all sessions for that user.

## API Impact

- Adds POST /api/v1/auth/change-password.

## Workflow Impact

Part of the account-security workflow; forces re-login on all devices after a password change.

## Security Impact

- New password must never be logged or returned in any response (AUTH-066, AUTH-067).
- All old sessions revoked immediately (AUTH-074).

## Testing Required

- Unit test: policy-violating password is rejected with the specific validation reason.
- Unit test: successful change revokes all sessions and records an audit entry.

## Deliverables

- ChangePasswordUseCase, controller, route, DTOs, tests.

## Acceptance Criteria

- Password not meeting policy is rejected (400/422).
- Successful change revokes all sessions.
- Audit Trail entry created.
- Password hash is never returned or logged.

## Definition of Done

- Implemented, tested, matches AUTH-056 to AUTH-076.

---

## Dependency Detail

- **Blocked By:** task-007.
- **Required Before:** None blocking.
- **Can Run In Parallel With:** task-008, task-009.
