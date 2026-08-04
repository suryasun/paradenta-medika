# Pages: Reporting & Dashboard Module

> Status: **Proposed Design, backend-grounded** (Phase 3 Epic AG/AH — Advanced Reporting, backend built and tested; no frontend yet). Routes verified against `apps/backend/src/modules/reports/presentation/routes/*.ts`. Note: Reservation and Queue each already shipped their own lightweight analytics pages (`reservation.md` §5, `queue.md` §5) directly in their own modules, outside this centralized Reporting module — this doc covers only the centralized Reporting module's own routes, not those two.

---

## 1. Page Inventory

| Area | Routes | Permission |
|---|---|---|
| Dashboards (5, not 6) | `GET /reports/dashboards/{executive,operations,clinical,finance,warehouse}` | dashboard-specific, not read in full this pass |
| Report Catalog | `GET /reports/definitions` | `report.catalog.read` |
| On-demand report | `GET /reports/:reportCode` | (per-report) |
| Async report jobs | `POST /reports/:reportCode/jobs`, `GET /reports/jobs/:jobId`, `.../cancel` | `report.job.create`, `.cancel` |
| Snapshots | `GET /reports/snapshots/:snapshotId` | `report.job.create` |
| Export download | `GET /reports/exports/:artifactId/download` | `report.export.download` |

**Gap flagged against the pre-verification draft:** it assumed 6 dashboards (Executive/Operational/Financial/Inventory/HR/Clinical & Quality) as one taxonomy. The real backend has exactly 5 dashboard routes — **Executive, Operations, Clinical, Finance, Warehouse** — and **no HR dashboard route exists**, consistent with HR having no backend module at all (see `hr.md`'s own status banner). "Operational Reports" and "Inventory Reports" from the draft map roughly to Operations/Warehouse dashboards respectively, but the draft's report-catalog breakdown (Financial Reports/Inventory Reports/HR Reports as separate large sections) doesn't cleanly map onto "5 dashboards + 1 generic on-demand-report-by-code system" — the real architecture is a **projection-based dashboard layer** (5 fixed dashboards) **plus a separate generic report-catalog/job/snapshot/export system** that serves any report by `reportCode`, not a fixed page per report category. This is a materially different information architecture than the draft assumed, worth designing around directly rather than forcing the old 6-category structure onto it.

---

## 2. Dashboards (5 fixed routes)

Each dashboard is a KPI/summary view for one audience — the pre-verification draft's per-card requirement holds up well and should carry forward as the binding pattern for all 5:

```text
{Executive|Operations|Clinical|Finance|Warehouse} Dashboard
├── KPI cards, each showing: metric value + trend delta + dataAsOf timestamp
│   + freshness badge (fresh/refreshing/stale/partial/failed — never just
│   fading text, per business-rules.md's cross-cutting rule that dashboards
│   must never present lagging data as real-time)
└── (per-dashboard detail sections — not read from the backend DTOs in this
    pass; each dashboard's specific KPI list should be verified against its
    controller/DTO before implementation, same rigor this session applied
    to Finance/Warehouse route verification, just not done for these 5
    individually given this pass's scope)
```

This directly reuses the freshness/`dataAsOf` pattern Reservation and Queue's own analytics pages already partially established (`reservation.md` §5's date-range + metadata line, `queue.md` §5's same pattern) — Reporting's dashboards should be the canonical, most rigorous version of that pattern (explicit freshness badge, not just a date range), and the two module-local analytics pages could arguably be retrofitted to match once this is built, though that's a forward-looking note, not this pass's scope.

## 3. Report Catalog + On-Demand + Async Jobs

`GET /reports/definitions` (`report.catalog.read`) implies a catalog/browse page listing available report definitions (name, description, required filters) — the entry point before requesting any specific report. `GET /reports/:reportCode` is a synchronous on-demand fetch (small/fast reports); `POST /reports/:reportCode/jobs` is the async path (large exports — per `docs/06-tasks/phase-3-plan.md`'s Epic AH "Async Jobs" framing) with its own job detail/cancel/snapshot/download routes. The UI distinction matters: **the catalog page should route a report request to either the sync or async path based on the report definition's own metadata** (not a user choice), showing a progress/polling state for async jobs (job status: queued/running/completed/failed, with Cancel available while queued/running) and a direct render for sync ones.

`report.export.download` being its own distinct permission (separate from `report.job.create`) implies download access can be granted/restricted independently of report-generation access — worth a visible distinction in the UI (e.g. a user who generated a report but lacks download permission sees the job completed but the Download button disabled-with-tooltip, not hidden, per this codebase's now-consistent visible-but-disabled convention for policy-blocked-not-feature-absent actions).

## 4. Export

Per the pre-verification draft's citation (still valid) and this session's cross-module confirmation (SAD §8.4 in both Finance and Warehouse mandate export as an audited action): every export surface should show "Export is logged" microcopy near the action, consistently worded across Finance/Warehouse/Reporting rather than each module inventing its own phrasing.

---

## 5. RBAC

No permission-to-role table was read in this pass beyond the route-level permission strings above (`report.catalog.read`, `report.job.create/cancel`, `report.export.download`, plus per-dashboard permissions not enumerated here). Flagged as an open item — same caveat as Finance/Warehouse's RBAC sections.

---

## 6. Navigation

**Entry points:** no shipped sidebar entry exists yet. Given the real architecture (5 fixed dashboards + 1 generic catalog/job system, not 6 category pages), the sidebar structure should reflect that split directly: a "Dashboards" group (5 items) and a separate "Reports" entry (opens the catalog).

`navigation.md` §4's existing Reporting tree (`Executive Dashboard / Operational Reports / Financial Reports / Inventory Reports / HR Reports / Clinical & Quality Reports`) should be corrected to the real 5-dashboard set (no HR dashboard) plus the catalog/job system — done as part of this pass (see the corresponding edit).

## 7. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**This module is where interactive charts matter most system-wide** — it's the centralized home for exactly the KPI/trend visualization every other module's reports (Finance, Warehouse) and analytics pages (Reservation, Queue) individually flagged as chart-less. All 5 dashboards (§2) and every catalog report (§3) render via Recharts (`design-system.md` §11.4) with the mandatory "View as table" toggle and `motion-complex` transitions on filter change. **Live update** is the other headline fit: the freshness badge (§2, fresh/refreshing/stale/partial/failed) is only meaningful if the dashboard actually re-polls and animates incoming data — a freshness badge next to data that only updates on manual page reload is misleading regardless of how well-designed the badge itself is; `ui-guidelines.md` §9.2's diff-animation rule applies directly to every KPI card here. Async report jobs (§3) get a **micro-interaction** progress indicator (queued→running→completed, per that section's own status description) using the existing `Progress` component (`design-system.md` §7) rather than a static "check back later" message. Not applicable: drag-and-drop, inline edit, odontogram — this module is read-heavy by nature, nothing here is user-editable data.

---

## 8. Multi Branch Platform Addendum (Phase 4, task-218/219/220 — `docs/06-tasks/phase-4-documentation/`)

Three new pages, distinct in shape from the 5 fixed dashboards in §2: those are current-value-only (no time series in the backend response, per §2's own note); these three genuinely differ from each other in exactly that dimension, and each page's shape should match what its own endpoint actually returns rather than defaulting all three to the same KPI-card layout.

### 8.1 Branch Dashboard (`/reports/dashboards/branch`, new page)

```text
Branch Dashboard
├── Header: H1 + Branch selector (required — unlike the 5 fixed
│   dashboards, this endpoint has no "all branches" mode) + freshness
│   Badge + dataAsOf (same shape as §2's existing dashboards)
└── KPI grid: Queue summary cards (Total Queue, Average Waiting,
    Doctor Performance) + Billing daily-summary cards, one grid —
    current-value-only, same as §2, no fabricated trend chart here
```

Gated `report.dashboard.branch.read`. `403 RPT_SCOPE_FORBIDDEN` (requester's branch assignment doesn't include the selected branch) renders via the standard inline `getApiErrorMessage` pattern.

### 8.2 Branch Comparison (`/reports/branch-comparison`, new page)

```text
Branch Comparison
├── Header: H1 + multi-branch selector
├── Comparison Table: metric rows × branch columns (same metric set per
│   branch, side-by-side — task-219's own AC)
└── One TrendChart per key metric, branch on the category axis (reuses
    the existing TrendChart component's "view as table" toggle —
    xKey=branchName, yKey=metricValue — not a new chart component)
```

Gated `report.branch-comparison.read`. TC-RPT-008: a requested branch outside the requester's authority rejects the **whole** request (`403 RPT_SCOPE_FORBIDDEN`) — the UI should not attempt partial rendering of the branches that *did* pass, since the backend never returns a partial result for this endpoint.

### 8.3 Branch Performance (`/reports/branch-performance`, new page)

```text
Branch Performance
├── Header: H1 + branch selector + date-range picker (max 90 days —
│   backend rejects a larger range with 422 RPT_RANGE_TOO_LARGE)
├── TrendChart: date on the x-axis (the one Phase 4 report whose data
│   is genuinely a day-by-day series, per the backend's per-day fan-out
│   design — not fabricated) — one chart per metric (total patients,
│   avg waiting time, billing collected)
└── Underlying data table (TrendChart's built-in toggle)
```

Gated `report.branch-performance.read`. Distinct from §8.2 by construction, not just by name: Comparison is one point in time across branches, Performance is one branch across time — the two pages should never be visually interchangeable.

### 8.4 Interactivity

§8.2/§8.3 are this addendum's own contribution to §7's "interactive charts" theme — both reuse `TrendChart` directly rather than introducing a second chart component. §8.1 stays KPI-cards-only, consistent with §2's own current-value-only constraint. Not applicable: drag-and-drop, inline edit, odontogram.
