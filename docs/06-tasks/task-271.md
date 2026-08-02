# task-271: Public API Gateway Enablement

**Phase:** Phase 6 - Healthcare Ecosystem
**Epic:** DI. Public API
**Feature:** DI1. API Key Access
**Module:** System
**Priority:** P2 - Medium

---

## Business Goal

Enable the API Key authentication mode that Phase 5's task-235 (API Gateway Deployment) explicitly marked '(Future)', and apply the literal Public API rate limit from docs/03-sad/09-api-standard.md, realizing the roadmap 'Public API' item — external third-party access to a defined subset of Parakita's REST API.

## Depends On

- task-235 (API Gateway Deployment, Phase 5)
- task-013 (Authentication Middleware)
- task-014 (Authorization Middleware)
- task-006 (Audit Trail Service)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/09-api-standard.md (Rate Limiting Recommendation table ('Public API | 60 request / menit', distinct from 'Protected API | 300 request / menit')) and docs/03-sad/25-security.md Section 11 API Gateway Ready Architecture ('API Key (Future)')
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-235, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `ApiKey` entity (keyHash, ownerOrganization, scopedPermissions — a subset of the internal RBAC permission catalog, expiresAt).
- Infrastructure layer: Prisma migration for `system_api_keys`; API Gateway (task-235) configuration to authenticate API-Key-bearing requests and apply the literal 60 request/minute limit distinct from the existing 300 request/minute Protected API limit.
- Application layer: `IssueApiKeyUseCase`, `RevokeApiKeyUseCase` (Administrator-only).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_api_keys table.

## API Impact

Adds POST/DELETE /system/api-keys (convention-derived, Administrator-only management endpoints); every existing endpoint exposed to Public API consumers is now reachable via API Key in addition to JWT.

## Workflow Impact

A defined subset of already-built endpoints becomes accessible to external integrators without a user login session, realizing 'Public API.'

## Security Impact

API keys carry a scoped permission subset (never full access); rate-limited at the literal 60/min ceiling; revocable at any time. Which specific endpoints are exposed to Public API consumers (versus remaining JWT-only) is a scope decision this task's Definition of Done requires to be explicitly documented, not silently defaulted to 'everything.'

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `ApiKey` entity, migration, repository
- `IssueApiKeyUseCase`, `RevokeApiKeyUseCase`, routes, controllers, tests
- API Gateway configuration applying the literal 60/min limit to API-Key-authenticated requests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- An API-Key-authenticated request exceeding 60/min receives a 429.
- A revoked API key is rejected on its next use.
- The set of endpoints exposed to Public API consumers is explicitly documented, not left as an implicit 'everything.'

## Definition of Done

API Key issuance, revocation, and rate-limited Gateway enforcement implemented and tested against the literal 60/min limit.

---

## Dependency Detail

- **Blocked By:** task-235
- **Required Before:** See phase-6-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
