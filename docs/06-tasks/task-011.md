# task-011: Forgot Password (POST /api/v1/auth/forgot-password)

**Phase:** Phase 1 - Foundation (MVP)  
**Epic:** A. Authentication & Authorization  
**Feature:** A2. Password Recovery  
**Module:** Authentication  
**Priority:** P2 - Medium

---

## Business Goal

Allow a user who has lost access to their password to request a password-reset token via their registered email/identifier.

## Depends On

- task-007

## Required Documents

- **AI Contract:** docs/04-ai-contract/05-auth-contract.md (AUTH-072, AUTH-073)
- **PRD:** docs/01-prd/business-rules.md
- **SAD:** docs/03-sad/10-authentication.md Section 20 (Forgot Password)
- **Design:** N/A

## Required Existing Code

task-004 (SMTP config for sending the reset link/token) -- if SMTP is not yet available, this task's email-sending step should be stubbed behind a documented interface, not skipped silently.

## Backend Scope

- ForgotPasswordUseCase: locate user by email/identifier, generate a single-use, expiring password-reset token (AUTH-072, AUTH-073), send it via email (or log it in non-production environments).
- Response must not reveal whether the identifier exists (to avoid user enumeration) -- always return a generic "if this account exists, a reset link was sent" response.
- POST /api/v1/auth/forgot-password controller + DTOs.

## Frontend Scope

- Forgot Password form (email/identifier input) and a generic confirmation message.

## Database Impact

- New password_reset_tokens table (or column set) storing token hash, expiry, used flag.

## API Impact

- Adds POST /api/v1/auth/forgot-password.

## Workflow Impact

Feeds into task-012 (Reset Password) to complete the recovery workflow.

## Security Impact

- No user enumeration via response differences.
- Reset token must be single-use and time-limited.

## Testing Required

- Unit test: token generated and stored with correct expiry for an existing user.
- Unit test: response is identical (generic) for existing vs non-existing identifiers.

## Deliverables

- ForgotPasswordUseCase, controller, route, DTOs, password_reset_tokens migration, tests.

## Acceptance Criteria

- A reset token is created and delivered (email or logged) only for existing accounts, but the API response does not reveal existence.
- Token is single-use and expires.

## Definition of Done

- Implemented and tested; migration applied.

---

## Dependency Detail

- **Blocked By:** task-007.
- **Required Before:** task-012 (Reset Password).
- **Can Run In Parallel With:** task-008, task-009, task-010.
