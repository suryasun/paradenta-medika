# Pages: Reporting & Dashboard Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/reporting.md` §4.2–4.7 (KPI/report catalog) and its Actor Matrix.

---

## Page Inventory

| Page | Purpose | Primary audience |
|---|---|---|
| Executive Dashboard | Visits, patient growth, collection, accounting revenue, net result, outstanding, queue SLA, low stock, payroll cost | Owner |
| Operational Reports | Patient registration, reservation/no-show, queue performance, visit/treatment, billing daily, activity/audit | Clinic Manager, Cashier |
| Financial Reports | Trial balance, general ledger, income statement, cash flow, revenue reconciliation, expense, closing, payroll summary | Finance, Owner |
| Inventory Reports | Stock balance, stock card, movement, purchase, expiry, opname | Warehouse Staff |
| HR Reports | Headcount, attendance, leave/overtime, payroll register, contract/document expiry | HR Staff |
| Clinical & Quality Reports | Visit/treatment/diagnosis aggregate, provider workload, outcome quality (no patient-identifying detail by default) | Doctor (own scope), Clinic Manager |

## Dashboard Card Requirements (per reporting.md §3.6 Dashboard State)

Every KPI card/report must show:

```text
KPI Card
├── Metric value + trend delta
├── dataAsOf timestamp
└── Freshness badge: fresh / refreshing / stale / partial / failed
```

A `stale` or `partial` state must be visually distinct (a small badge, never just fading text) — this is a **binding constraint** from `docs/01-prd/business-rules.md`'s cross-cutting rules, not a cosmetic choice: dashboards must never present lagging data as if it were real-time.

## Export

Every exportable report/table shows who can export (role-gated), and the export itself is logged (reporting.md §1.5 "Export is sensitive") — the UI should show a small "Export tercatat pada audit log" microcopy near the export button.
