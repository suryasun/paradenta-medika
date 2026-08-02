# task-236: Message Broker Adapter (Internal Event Bus Migration)

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CD. Message Broker Migration
**Feature:** CD1. Event Bus Migration
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Implement a message-broker-backed adapter behind the existing Internal Event Bus interface, per docs/03-sad/03-clean-architecture.md Section 34.5 Event Delivery, which explicitly names the target technologies (RabbitMQ, Kafka, NATS, Google Pub/Sub) and guarantees the migration happens 'tanpa mengubah Business Rule' (without changing business rules) — the roadmap Phase 5 'Message Broker' item.

## Depends On

- task-136 (Consume Material Event Consumer, Phase 3)
- task-162 (Automatic Billing Event Consumer, Phase 3)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/03-clean-architecture.md (Section 34.4 Event Principle (Publisher does not know Subscriber), Section 34.5 Event Delivery (Internal Event Bus replaceable by RabbitMQ/Kafka/NATS/Google Pub/Sub)) and docs/03-sad/02-system-architecture.md Section 23 Internal Event Bus
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-136, task-162, and every other event publisher/consumer built across Phase 1–4 (task-021's PatientRegistered, task-002's ReservationCreated, task-114's warehouse.goods-receipt.posted.v1, task-224's BranchCreated, etc.).

## Backend Scope

- Infrastructure layer: a `MessageBrokerEventBus` implementation of the existing `IEventBus` port (the same interface every Phase 1–4 publisher/consumer already codes against per the Clean Architecture's dependency-inversion pattern), backed by a concrete broker — the SAD names four candidates (RabbitMQ, Kafka, NATS, Google Pub/Sub) without selecting one; this task's first sub-step is to confirm the actual broker choice against the deployment environment (already-provisioned infrastructure) before implementation, per CLAUDE.md's 'never introduce a new library/tool without approval.'
- Preserves at-least-once delivery, idempotent consumption (every existing consumer already implements idempotency per its own task's Definition of Done — e.g. task-136/162's redelivery tests), and ordering guarantees where an existing consumer's Definition of Done required them.
- Dual-write/shadow-mode cutover plan: run the new broker alongside the in-process bus, verify parity, then cut over — not a big-bang replacement.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

No schema change to business tables; may add an outbox/broker-offset tracking table if not already present from Phase 1–4's outbox pattern.

## API Impact

None (internal infrastructure swap; no public endpoint changes).

## Workflow Impact

Every cross-module event flow built in Phase 1–4 (PatientRegistered, ReservationCreated, warehouse.goods-receipt.posted.v1, system.configuration.changed.v1, BranchCreated, etc.) now flows through the broker instead of the in-process bus, with no business-rule change per the SAD's explicit guarantee.

## Security Impact

Broker connection credentials must be sourced from the Secret Management system (task-252 in this phase, or task-225's environment-configuration pattern if delivered first).

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- Broker selection decision (documented, not invented)
- `MessageBrokerEventBus` adapter implementing the existing `IEventBus` port
- Cutover runbook (shadow-mode → parity verification → cutover → rollback plan)
- Regression test suite re-running every existing event consumer's idempotency/ordering tests against the new adapter

## Acceptance Criteria

Per docs/03-sad/24-deployment.md and docs/03-sad/25-security.md (no dedicated PRD acceptance-criteria file exists for infrastructure/security):

- Every existing event consumer's own idempotency and (where required) ordering tests pass unchanged against the new adapter.
- No business rule or event contract changes as a side effect of this migration, per the SAD's explicit guarantee.

## Definition of Done

Adapter implemented, cutover completed via the documented runbook, and the full existing event-consumer regression suite passes against the new broker. **Ambiguity flagged (see phase-5-plan.md):** the SAD names four broker candidates without selecting one; this task's Backend Scope requires that selection to be made and documented as part of implementation, not guessed here.

---

## Dependency Detail

- **Blocked By:** task-136, task-162
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
