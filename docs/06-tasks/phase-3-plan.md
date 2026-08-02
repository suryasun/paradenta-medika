# Phase 3 Task Plan — Operational Excellence

**Source:** docs/03-sad/26-roadmap.md Section 6 (Phase 3 — Operational Excellence)
**Task Range:** task-095 through task-209 (115 tasks)
**Scope:** Warehouse module (docs/03-sad/18-module-warehouse.md), Finance module (docs/03-sad/17-module-finance.md), Reporting module (docs/03-sad/20-module-report.md), and System Administration module (docs/03-sad/21-module-system.md), covering the roadmap's Phase 3 New Features (Inventory Management, Purchase Request, Procurement, Supplier Management, Finance Integration, Advanced Reporting, Audit Dashboard, Notification Center, Approval Workflow) and Automation items (Automatic Stock Update, Automatic Billing Event, Scheduled Reports, Daily Closing, Reminder Notification).

Per explicit user instruction, this plan covers **Phase 3 only**. Phase 4 (Multi Branch Platform) is out of scope and has not been started.

---

## Ambiguities and Gaps Reported

The following points are not fully resolved by the SAD/PRD as written. They are flagged here rather than guessed, per CLAUDE.md's "never invent business rules" rule. Each is also repeated in the affected task's Definition of Done.

1. **Cross-module event contracts are described conceptually, not as literal schemas.** UC-WHS-003 (Consume Material from EMR, task-136) and UC-FIN-001 (Post Billing Payment, task-162) both describe consuming an event from another module (EMR's treatment-material-finalization event; Billing's `PaymentReceived` event), but neither docs/03-sad/18-module-warehouse.md, docs/03-sad/17-module-finance.md, nor docs/03-sad/02-system-architecture.md's Event Catalog (as reviewed) enumerate the literal event name/payload schema for these two specific events with field-level detail. Both tasks build the conceptual consumer described in their UC narrative; the literal event contract must be confirmed against the owning module's actual implementation (Phase 1 Billing / Phase 2 EMR) before either consumer is wired to a live topic.

2. **Doctor Fee Settlement source records are not schema-defined.** UC-FIN-006 (task-166) references "unsettled doctor-fee source records" without a literal source table/event in the reviewed SAD sections. The task flags that the source (likely a per-treatment fee calculation in EMR or Billing) must be confirmed before real settlement generation.

3. **Reminder Notification trigger conditions are not enumerated.** UC-SYS-005 (task-199) defines the generic template/delivery/retry/dead-letter mechanism, but the roadmap's "Reminder Notification" automation item (specific triggers such as "reservation reminder 24h before" or "batch nearing expiry") is not specified anywhere in docs/03-sad/21-module-system.md. task-199 builds the delivery mechanism only; wiring specific reminder triggers from Reservation, Warehouse, or Finance is explicitly out of scope pending confirmation of each trigger's source event.

4. **Financial Period enforcement sequencing.** task-168 (Financial Period) is numbered after task-150 (Post Journal) because Journals are foundational to Phase 3's critical path, but Post Journal's `FIN_PERIOD_CLOSED` check depends on the Period entity existing. This is flagged in task-168's Workflow Impact: if implementation follows strict numeric order, task-150 will need a follow-up integration patch once task-168 lands, or the two should be implemented together. See Implementation Order below for the recommended parallel grouping that avoids this issue.

5. **Reporting module's literal source-event names.** docs/03-sad/20-module-report.md Section 7.2 (Source Events) describes the Event Contract pattern but, as reviewed, does not enumerate every literal event name per source module with field-level schema. task-178 (Projection Infrastructure) and each dashboard/report task flag that the specific event name must be confirmed against the owning module before going live.

6. **No page-level Design spec exists for any Phase 3 screen.** As with Phase 1 and Phase 2, docs/02-design/pages/overview.md documents this as an existing gap. Every task's Frontend Scope is deliberately backend-only or minimal pending a Design document.

7. **Approval Workflow permission codes are inferred, not literal.** docs/03-sad/21-module-system.md Section 6 lists endpoints without an explicit RBAC permission-code table (unlike Warehouse's `warehouse.item.read` style or Finance's `finance.journal.read` style, which are literal). System module tasks (Epic AK, AJ, AI, AL) therefore reference permission scope descriptively (e.g. "module-manager-scoped permission") rather than inventing a literal permission-code string; the literal codes must be defined in the System module's permission catalog before implementation.

---

## Task List by Epic

| Epic | Feature Area | Module | Tasks | Count |
|---|---|---|---|---|
| V. Warehouse Foundation | Item, Supplier, Warehouse Location, Stock Read | Warehouse | task-095–103 | 9 |
| W. Procurement | Purchase Order, Goods Receipt | Warehouse | task-104–114 | 11 |
| X. Stock Movement | Transfer, Adjustment, Reservation | Warehouse | task-115–126 | 12 |
| Y. Stock Opname & Batch | Physical Count, Batch/Expiry | Warehouse | task-127–135 | 9 |
| Z. Automatic Stock Update | EMR Material Consumption (event consumer) | Warehouse | task-136 | 1 |
| AA. Warehouse Reporting | Stock Card, Balance, Movements, Purchases, Expiry, Opnames | Warehouse | task-137–142 | 6 |
| AB. Finance Foundation | Chart of Accounts | Finance | task-143–145 | 3 |
| AC. Journals | Manual & System Journal | Finance | task-146–152 | 7 |
| AD. Cash & Expense Management | Cash Account, Cash Transfer, Expense | Finance | task-153–161 | 9 |
| AE. Daily Closing, Settlement & Period | Automatic Billing Event, Daily Closing, Doctor Fee Settlement, Financial Period | Finance | task-162–171 | 10 |
| AF. Finance Reporting | Trial Balance, GL, Income Statement, Cash Flow, Expenses, Daily Closing | Finance | task-172–177 | 6 |
| AG. Advanced Reporting — Dashboards | Projection Infra, Executive/Ops/Clinical/Finance/Warehouse/HR Dashboards | Reporting | task-178–184 | 7 |
| AH. Report Catalog & Scheduled Reports | Definitions, On-Demand, Async Jobs, Snapshots, Export | Reporting | task-185–191 | 7 |
| AI. Audit Dashboard | Audit Log, Activity Log, Operations Health | System | task-192–194 | 3 |
| AJ. Notification Center | Templates, Inbox, Delivery Worker (Reminder Notification) | System | task-195–199 | 5 |
| AK. Approval Workflow | System Parameter, Change Request/Approval, Feature Flag, Menu | System | task-200–206 | 7 |
| AL. Background Job Operations | Job Registry, Retry, Cancel | System | task-207–209 | 3 |

**Total: 115 tasks (task-095 through task-209).**

---

## Implementation Order

Numbered groups can generally run in parallel within themselves once their own listed dependencies are satisfied; groups are ordered so each only depends on earlier groups.

1. **Warehouse Foundation** — task-095–103 (Item, Supplier, Warehouse Location, Stock, Ledger). No Phase 3 dependencies beyond Phase 1's task-013/014/006.
2. **Finance Foundation** — task-143–145 (Chart of Accounts), task-146–152 (Journals). Can run in parallel with Group 1 — different module.
3. **Finance Period (recommended early)** — task-168–171 (Financial Period + Lock/Close/Reopen). Pulled forward in this ordering (ahead of numeric sequence) so task-150 (Post Journal)'s `FIN_PERIOD_CLOSED` check has a real Period table to validate against from day one — see Ambiguity #4.
4. **Warehouse Procurement** — task-104–114 (Purchase Order, Goods Receipt), depends on Group 1.
5. **Warehouse Stock Movement & Opname** — task-115–135 (Transfer, Adjustment, Reservation, Opname, Batch), depends on Group 1 (and Group 4 for any PO/GR cross-reference, though Transfer/Adjustment/Reservation/Opname/Batch are independent of Procurement).
6. **Warehouse Automatic Stock Update** — task-136, depends on Groups 1 and 5 (Stock, Ledger, Batch).
7. **Warehouse Reporting** — task-137–142, depends on Groups 1, 4, 5, 6 (reads their tables).
8. **Finance Cash & Expense** — task-153–161, depends on Group 2.
9. **Finance Daily Closing, Settlement & Automatic Billing Event** — task-162–167, depends on Groups 2, 3, 8.
10. **Finance Reporting** — task-172–177, depends on Groups 2, 3, 9.
11. **System Foundation for Reporting/Notification/Approval** — task-192–194 (Audit Dashboard, independent), task-195–199 (Notification Center), task-200–206 (Approval Workflow), task-207–209 (Background Job Operations). All depend only on Phase 1's task-013/014/006 and can run in parallel with Groups 1–10.
12. **Advanced Reporting** — task-178 (Projection Infrastructure) can start as soon as task-013/014 exist, but task-179–184 (Dashboards) and task-185–191 (Catalog/Jobs) are only meaningfully testable once Groups 1–10 have produced real source data/events to project. Recommended sequencing: build task-178 early (parallel with Group 1–2), implement task-179–191 last, after the modules they read from (Warehouse, Finance, and Phase 1/2's Patient/Reservation/Queue/EMR/Billing/HR) are live.

**Critical path:** task-095 (Item) → task-104 (PO entity) → task-108 (Approve PO) → task-111 (GR entity) → task-112 (Create GR) → task-102/103 (Stock/Ledger, prerequisite, can be built alongside) → task-114 (Post GR, first real Automatic Stock Update realization) → task-136 (Consume Material) confirms the pattern end-to-end. In parallel: task-143 (Account) → task-146 (Journal entity) → task-150 (Post Journal) → task-153 (Cash Account) → task-162 (Automatic Billing Event) → task-163 (Daily Closing entity) → task-164 (Create Daily Closing) realizes the Daily Closing automation end-to-end.

---

## Phase-Level Dependencies

- All Phase 3 tasks depend on Phase 1's task-013 (Authentication Middleware), task-014 (Authorization Middleware), and task-006 (Audit Trail Service) — every task explicitly lists these.
- Epic Z (task-136, Automatic Stock Update) depends on an EMR event whose literal contract is owned by Phase 2's EMR module (Epic L/M) — see Ambiguity #1.
- Epic AE's task-162 (Automatic Billing Event) depends on a Billing event whose literal contract is owned by Phase 1's Billing module (Epic H) — see Ambiguity #1.
- Epic AG (Advanced Reporting Dashboards) is architecturally downstream of every other module in Phase 1, Phase 2, and Phase 3 (Patient, Reservation, Queue, EMR, Billing, Warehouse, Finance, HR) per docs/03-sad/20-module-report.md's read-model architecture — it is the last Epic that should go live even though its foundational task-178 can be built early.
- Epic AJ's task-199 (Notification Delivery Worker) is a service other modules' future reminder features will call into; no Phase 3 task currently wires a live reminder trigger into it (see Ambiguity #3).

---

## Phase 3 Definition of Done

- All 115 tasks (task-095–task-209) implemented per their individual Definition of Done, Acceptance Criteria, and the response/error envelope in docs/04-ai-contract/04-api-contract.md.
- Every Warehouse write path enforces the 10 error codes in docs/03-sad/18-module-warehouse.md Section 6.5 (WHS_STOCK_INSUFFICIENT, WHS_NEGATIVE_STOCK_FORBIDDEN, WHS_BATCH_REQUIRED, WHS_BATCH_EXPIRED, WHS_DUPLICATE_MOVEMENT, WHS_PO_NOT_APPROVED, WHS_RECEIPT_OVER_QUANTITY, WHS_OPNAME_ALREADY_ACTIVE, WHS_ADJUSTMENT_APPROVAL_REQUIRED, WHS_SOURCE_DESTINATION_SAME).
- Every Finance write path enforces the 10 error codes in docs/03-sad/17-module-finance.md Section 6.6 (FIN_JOURNAL_UNBALANCED, FIN_PERIOD_CLOSED, FIN_ACCOUNT_NOT_POSTABLE, FIN_DUPLICATE_POSTING, FIN_EXPENSE_NOT_APPROVED, FIN_CLOSING_DUPLICATE, FIN_CLOSING_VARIANCE_REASON_REQUIRED, FIN_SETTLEMENT_SOURCE_USED, FIN_SEGREGATION_OF_DUTIES, FIN_ACCOUNT_MAPPING_MISSING).
- Reporting never double-counts on duplicate/out-of-order event delivery (TC-RPT-001/002/003) and every metric/report carries definitionVersion/scope/filter/dataAsOf metadata.
- Audit log is provably immutable (SYS_AUDIT_IMMUTABLE) and every high-risk System configuration change requires independent approval (SYS_CONFIG_APPROVAL_REQUIRED, no self-approval).
- All Ambiguities/Gaps above are either resolved with real source-of-truth documentation or explicitly still flagged (not silently guessed) in the corresponding implementation.
- Unit, integration, and API tests exist for every task per docs/05-testing/.

## Phase 3 Acceptance Criteria

- Inventory Management: Item/Supplier/Warehouse master data manageable; stock balance and ledger queryable and accurate after every posted movement.
- Purchase Request & Procurement: PO lifecycle (draft→submitted→approved/rejected→cancelled) enforced with maker-checker; Goods Receipt posting increments stock exactly once per receipt (idempotent).
- Supplier Management: suppliers creatable/listable and referenceable by Purchase Orders.
- Automatic Stock Update: EMR material consumption and Goods Receipt/Adjustment/Opname/Transfer postings all correctly adjust warehouse_stocks with FEFO where applicable, with no double-counting on redelivery.
- Finance Integration: Chart of Accounts, Journals (manual and system-generated), Cash/Expense, and Doctor Fee Settlement all enforce balanced posting and segregation of duties.
- Daily Closing: expected-vs-counted cash reconciliation enforced with mandatory variance reason; Automatic Billing Event posts a balanced journal per successful Billing payment.
- Advanced Reporting: all six roadmap-relevant dashboards (Executive, Operations, Clinical, Finance, Warehouse, HR) return scoped, freshness-annotated data; Scheduled Reports (async jobs) support large exports with snapshot integrity and expiry.
- Audit Dashboard: audit and activity logs are queryable, filterable, immutable, and access-redacted per role.
- Notification Center: templates are versioned/validated, notifications are deliverable with retry/dead-letter handling (Reminder Notification mechanism ready for future trigger wiring).
- Approval Workflow: high-risk System configuration changes require independent approval before activation, with full version history and rollback.
