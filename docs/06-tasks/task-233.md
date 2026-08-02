# task-233: Access Review Automation

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CB. Enterprise RBAC
**Feature:** CB2. Access Review
**Module:** System
**Priority:** P1 - High

---

## Business Goal

Implement `GenerateAccessReviewUseCase`, realizing docs/03-sad/21-module-system.md Section 12.3's 'access-review automation' roadmap item — a periodic, scheduled report listing every user's current role/branch/permission grants for a Security Admin to certify or flag for revocation.

## Depends On

- task-017 (Role List & Create)
- task-192 (Audit Log Query)
- task-232 (Delegated & Time-Bound Access Grant)

## Required Documents

- **AI Contract:** docs/04-ai-contract/07-module-contract.md, docs/04-ai-contract/04-api-contract.md, docs/04-ai-contract/06-database-contract.md, docs/04-ai-contract/09-security-contract.md, docs/04-ai-contract/05-auth-contract.md
- **PRD:** docs/01-prd/features/system.md, docs/01-prd/business-rules.md § 10
- **SAD:** docs/03-sad/21-module-system.md (Section 12.3 Roadmap (Phase 3 row: 'access-review automation'))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-017, task-192, task-232, task-013, task-014, task-006.

## Backend Scope

- Domain layer: `AccessReviewCycle` entity (period, generatedAt, reviewerUserId, status).
- Infrastructure layer: Prisma migration for `system_access_review_cycles` and `system_access_review_items` (one row per user × role/branch/delegated-grant).
- Application layer: `GenerateAccessReviewUseCase` (scheduled or on-demand, produces a snapshot of every active grant) and `CertifyAccessReviewItemUseCase` (reviewer marks each item confirmed or flags it for revocation, which triggers a follow-up notification to an Administrator per task-199's delivery worker).

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

Creates system_access_review_cycles and system_access_review_items tables.

## API Impact

Adds POST /system/access-reviews (generate), GET /system/access-reviews/{cycleId}, POST /system/access-reviews/{cycleId}/items/{itemId}/certify (convention-derived).

## Workflow Impact

Realizes the 'Enterprise RBAC' roadmap capability's governance sub-feature; complements the Central Audit epic's organisation-wide governance analytics.

## Security Impact

Only a Security Admin/Owner can generate or certify a review cycle. Audit Trail entry required for every certification decision.

## Testing Required

- Unit tests for the Use Case/Entity (per docs/05-testing/unit-tests.md).
- Integration test for Controller/Repository (per docs/05-testing/api-tests.md).

## Deliverables

- `AccessReviewCycle`/`AccessReviewItem` entities, migration, repository
- `GenerateAccessReviewUseCase`, `CertifyAccessReviewItemUseCase`, routes, controllers, tests

## Acceptance Criteria

Per docs/01-prd/acceptance-criteria/system.md:

- A generated review snapshot includes every active role assignment, branch assignment, and delegated grant, not a partial subset.
- Flagging an item for revocation produces a notification (via task-199) to an Administrator; it does not auto-revoke (human-in-the-loop by design).

## Definition of Done

Entities, migration, and endpoints implemented and tested. **Ambiguity flagged:** convention-derived endpoints; no literal Section 6 spec exists for this roadmap-maturity item.

---

## Dependency Detail

- **Blocked By:** task-017, task-192, task-232
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
