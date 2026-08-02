# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository currently contains **no source code** — only the specification/documentation set under `docs/`. There is no build system, package manifest, linter, or test runner to invoke yet. Do not fabricate build/lint/test commands; when source code is added to the repo, this file should be updated with the real commands.

## Role and non-negotiable rules

You are implementing production software for this project as a Senior Staff Software Engineer. You do **not** redesign the product or architecture — `docs/` is the single source of truth.

- Never invent APIs, database schema, or business rules.
- Never assume architecture beyond what's documented.
- If required information is missing from the docs, **stop and report it** — do not guess. State: what's missing, why it blocks the task, and which doc it should live in.
- Never rename public APIs, database tables, or entities; never change a response schema; never change existing architecture.
- Never bypass module boundaries or access another module's database directly (cross-module communication is events only — see `07-module-contract.md`).
- Never duplicate business logic that already exists elsewhere.
- Never introduce a new library without explicit approval.

## Document priority order

When documents conflict, resolve using this order (highest first):

1. **AI Contract** — `docs/04-ai-contract/` (the 10 numbered files `01-global-rules.md`…`10-code-generation-rules.md`; the unnumbered `api-contract.md`, `architecture-contract.md`, `database-contract.md`, `module-contract.md`, `security-contract.md`, `workflow-contract.md` are 3-line legacy stubs — **not authoritative**, superseded by the numbered files)
2. **Task Specification** — `docs/06-tasks/`
3. **Product Requirement (PRD)** — `docs/01-prd/`
4. **Design** — `docs/02-design/`
5. **Software Architecture Document (SAD)** — `docs/03-sad/`
6. **Existing source code**

## Working process (before writing any code)

1. Read the relevant task spec in `docs/06-tasks/` — start from the phase's `phase-N-plan.md` (lists every task, epic, dependencies, and implementation order for that phase) rather than scanning individual `task-*.md` files directly. Each phase plan also has its own "Ambiguities and Gaps Reported" section — check it before assuming a detail is settled.
2. Read the AI Contract (`docs/04-ai-contract/01-global-rules.md` through `10-code-generation-rules.md`) and extract the mandatory rules for architecture, API, database, workflow, security, module ownership, and coding style.
3. Read the PRD (`docs/01-prd/`) for business goal, business rules, acceptance criteria, edge cases, and user flow.
4. Read Design docs (`docs/02-design/`) for UI/UX, components, layout, navigation, and validation — note that this is largely a backend-focused SAD with significant documented design gaps (no visual design system source, no Figma links, no page-level spec for most modules except Patient Registration).
5. Read the SAD (`docs/03-sad/`) for architecture, database, API, auth, deployment, and security detail.

Before generating code, produce: (1) Documentation Reviewed, (2) Implementation Plan (files to create/modify, DB/API/frontend/security/testing impact), (3) Architecture Validation (confirm no architecture/module/security violations), then (4) the code itself. No placeholders, no TODO/FIXME, no half-finished implementations.

## Documentation map

### `docs/04-ai-contract/` — Priority 1
- `01-global-rules.md` — never invent, never redesign, missing-info escalation, priority order.
- `02-architecture-contract.md` — Clean Architecture layering, module boundaries, dependency direction.
- `03-project-structure-contract.md` — mandated backend/frontend folder layout.
- `04-api-contract.md` — request/response envelope, pagination, sorting, filtering, error format, status codes.
- `05-auth-contract.md` — JWT/refresh-token/session contract, RBAC enforcement.
- `06-database-contract.md` — migration strategy, audit columns, soft-delete policy, index/FK policy.
- `07-module-contract.md` — module ownership, cross-module communication (events only).
- `08-workflow-contract.md` — business workflow/state-transition rules, required sequence diagrams.
- `09-security-contract.md` — OWASP/RBAC/input-validation/audit requirements.
- `10-code-generation-rules.md` — no placeholders, no TODO, determinism.

### `docs/06-tasks/` — Priority 2
283 individual task files (`task-001.md`–`task-283.md`) plus 6 phase-index files. Always start from the phase plan:
- `phase-1-plan.md` — Foundation/MVP: task-001–059 (Auth, Master Data, Patient, Reservation, Queue, EMR Basic, Billing Basic, Dashboard Simple).
- `phase-2-plan.md` — Core Clinical Operations: task-060–094 (Appointment Management, full EMR — Treatment Planning, Prescription, Odontogram, Periodontal, Attachment, Consent, Medical Certificate, Referral, Clinical Timeline).
- `phase-3-plan.md` — Operational Excellence: task-095–209 (Warehouse, Finance, Advanced Reporting, Audit Dashboard, Notification Center, Approval Workflow).
- `phase-4-plan.md` — Multi Branch Platform: task-210–230 (branch assignment/config, centralized user mgmt, branch-level access control, branch dashboards, centralized master data, branch sync, infra evolution).
- `phase-5-plan.md` — Enterprise Platform: task-231–254 (mostly `Module: Infrastructure` — API Gateway, Message Broker, HA/DR, observability stack, SLA monitoring, secret management, SIEM, plus Enterprise RBAC, Data Warehouse/BI). One Design Spike task (SSO/External IdP — ADR only, no implementation).
- `phase-6-plan.md` — Healthcare Ecosystem, final phase (no Phase 7 exists): task-255–283 (National Health Integration, Insurance/Payment Gateway, Radiology/DICOM/PACS, AI Clinical Assistant, Predictive Analytics, Smart Scheduling, CDSS, Executive Intelligence, Healthcare Data Exchange). Six Design Spike tasks (National Health Integration, External Insurance/BPJS, Laboratory System, Video Consultation, Patient Mobile App, Doctor Mobile App — under-specified in the SAD, ADR-only).

### `docs/01-prd/` — Priority 3
- `vision.md`, `product-goals.md` — product vision and measurable goals.
- `business-rules.md` — aggregated business rules across all 11 modules (§1 Master Data, §2 Patient, §3 Reservation, §4 Queue, §5 EMR/Billing, §6 Finance, §7 Warehouse, §8 HR, §9 Reporting, §10 System).
- `features/` — `overview.md` + one file per module.
- `acceptance-criteria/` — `overview.md` + one file per module, derived from each SAD module's Test Scenario section (flagged missing where no dedicated Test Scenario section exists, e.g. Master Data, Patient, Queue).

### `docs/02-design/` — Priority 4
- `navigation.md`, `design-system.md` (flagged gap — no visual design source exists), `ui-guidelines.md`, `figma-links.md` (placeholder, documented gap).
- `pages/overview.md` — master page list; documents the "no page-level spec exists yet" gap referenced by most `task-*.md` Frontend Scope sections.
- `pages/patient.md` — the one module with an actual page-level spec (Patient Registration).

### `docs/03-sad/` — Priority 5
26 files, `01-system-overview.md`…`26-roadmap.md`. Notable ones:
- `03-clean-architecture.md` — Patient module Golden Reference (Section 41); event delivery future migration path (Section 34.5: RabbitMQ/Kafka/NATS/Pub-Sub).
- `09-api-standard.md` — rate limits: Login 5/min, Refresh 10/min, Public API 60/min, Protected API 300/min.
- `10-authentication.md` — JWT/session design; OAuth, SSO, LDAP, MFA, Social Login are explicitly out of scope (Future Enhancements only).
- `15-module-emr.md` — largest module: SOAP notes, Odontogram, Periodontal, Prescription, Consent, Dental X-Ray/DICOM/PACS (§3.3B), CDSS, Clinical Alert Engine, Recall Engine, Data Warehouse, AI Clinical Assistant, SATUSEHAT/HL7 FHIR targets.
- `19-module-hr.md` — out of scope: full national tax engine, BPJS integration, biometric devices.
- `26-roadmap.md` — **authoritative source for all 6 phases**; read first whenever re-deriving phase scope.

### `docs/05-testing/`
`test-strategy.md`, `unit-tests.md`, `api-tests.md`, `e2e-tests.md` — test pyramid and per-layer conventions.

## Known gaps (don't assume these are settled)

Explicitly flagged as missing/undecided across the phase plans' "Ambiguities and Gaps Reported" sections: SSO provider choice, National Health Integration details, Laboratory System spec, Message Broker/SIEM provider choice, JWT rotation interval, Patient Satisfaction KPI data source. Check the relevant `phase-N-plan.md` before treating any of these as decided.
