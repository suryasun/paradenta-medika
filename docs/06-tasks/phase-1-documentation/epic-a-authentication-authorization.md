# Epic A: Authentication & Authorization — Documentation (task-007–014)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/04-ai-contract/05-auth-contract.md` (AUTH-001–094, RBAC-001–016) — the authoritative, extracted contract from `docs/03-sad/10-authentication.md`
- `docs/06-tasks/task-007.md`–`task-014.md`
- `docs/03-sad/02-system-architecture.md` Section 17 (Authorization & RBAC)

## Task List

| Task | Name |
|---|---|
| task-007 | Login (POST /auth/login) |
| task-008 | Refresh Token (POST /auth/refresh) |
| task-009 | Logout (POST /auth/logout) |
| task-010 | Change Password (POST /auth/change-password) |
| task-011 | Forgot Password (POST /auth/forgot-password) |
| task-012 | Reset Password (POST /auth/reset-password) |
| task-013 | Authentication Middleware (JWT + Session Verification) |
| task-014 | Authorization Middleware (RBAC Permission Check) |

## Implementation Plan

Built the full JWT + refresh-token + session authentication pipeline exactly to AUTH-001–094: HS256-signed access tokens (`sub`/`username`/`role`/`sessionId`/`clinicId`/`iat`/`exp` claims per AUTH-014), opaque refresh tokens hashed before storage (AUTH-024), refresh rotation with reuse detection that revokes the entire session (AUTH-034–037), account lockout at 5 failed attempts / 15 min with escalating thresholds at 10 (require reset) and 20 (admin-review log) per AUTH-068–070, and bcrypt password hashing at 12 salt rounds (AUTH-064/065). `authenticate` middleware validates JWT + active session + active user (AUTH-055); `authorize`/`requirePermission` enforces RBAC deny-by-default (RBAC-002/003) and audits every denial (AUTH-086).

## Files Created

`apps/backend/src/modules/auth/` — full module: `application/{dtos,services,use-cases}/*`, `domain/{exceptions,repositories}/*`, `infrastructure/{repositories,services}/*`, `presentation/{controllers,middlewares,routes}/*`. See `phase-1-implementation-report.md` Section 3 for the module's total file count (36).

## Files Modified

`apps/backend/src/app.ts` (mounted `buildAuthModule`, exposed `authenticate`/`requirePermission` for reuse by every subsequent module).

## Database Changes

None beyond Epic J's initial migration (`User`, `UserSession`, `RefreshToken`, `PasswordResetToken` tables already scaffolded there; this epic is the first to actually read/write them).

## API Changes

| Endpoint | Auth | Rate Limit |
|---|---|---|
| `POST /auth/login` | none | 5/min (AUTH rate-limit policy) |
| `POST /auth/refresh` | none (refresh token in body) | 20/min |
| `POST /auth/logout` | JWT | — |
| `POST /auth/change-password` | JWT | — |
| `POST /auth/forgot-password` | none | — |
| `POST /auth/reset-password` | none (reset token in body) | — |

## Frontend Changes

Login page (`apps/frontend/app/(auth)/login/page.tsx`, `features/auth/*`) was built later, once the user explicitly requested frontend work — outside this epic's original backend-only scope. Logout wired into `Topbar.tsx`. Change/Forgot/Reset-password pages are **not yet built** on the frontend.

## Security Validation

- AUTH-013/066/067: access token never carries password; password hash never returned to any client response (`UserProfileDto` excludes it).
- AUTH-044: failed login returns a generic message, does not distinguish "user not found" vs "wrong password" vs "locked."
- AUTH-034–037: refresh-token reuse revokes the whole session and requires re-login — covered by `RefreshTokenUseCase.test.ts`.
- RBAC-008: all permission codes use `module.action` dot notation.
- Every login success/failure, logout, and permission denial writes an Audit Trail entry (AUTH-091).

## Architecture Validation

- Domain layer (`domain/exceptions`, `domain/repositories`) has zero Express/Prisma imports — confirmed via `tsc` layering and manual review.
- `JwtService`/`PasswordService` live in `application/services/` (application-layer services), not `domain/`, since they depend on external libraries (`jsonwebtoken`, `bcrypt`) — correctly infrastructure-adjacent, not pure business rule.
- No other module imports `auth/domain/*` directly; they consume `authenticate`/`requirePermission` as injected middleware only, preserving module boundary.
