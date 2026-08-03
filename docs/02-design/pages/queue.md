# Pages: Queue Module

> Status: **Verified against shipped code** (Phase 1, task-037–047). `docs/03-sad/14-module-queue.md` has no dedicated UI Pages section (95 sections, entirely backend/architecture-focused — real-time/WebSocket/Redis/outbox pattern etc.), so this remains a **Proposed Design** in the sense that no SAD screen spec exists to verify against — but every UI claim below is cross-checked against the shipped `apps/frontend/features/queue/` code and against SAD §19 (Status), §20 (Priority), §21 (Business Rules), §35 (Dashboard Flow), §65 (Security/Permission Matrix).

---

## 1. Page Inventory

| Page | Route | Purpose |
|---|---|---|
| Queue Board / List | `/queue` | Live 4-column Kanban (default) or a flat filtered grid | 
| Queue Dashboard | `/queue/dashboard` | Aggregate KPIs + per-doctor summary (task-047) |

**Gap flagged against the earlier pre-verification draft of this doc:** it listed "Queue Detail" (a single-ticket page) and "Queue History" (a dedicated history screen) as separate pages. Neither was built as a standalone route — a ticket's full state is entirely visible on its `QueueCard` (no drill-in page exists, none is needed at this data density), and "History" is reached by using the flat-grid mode with a Cancelled/No-Show/Skipped status filter on the same `/queue` route, not a separate screen. Documenting the 2 real routes rather than the 4 originally assumed.

---

## 2. Queue Board / List (`/queue`)

### Layout

```text
Queue
├── Header: H1 "Queue" + PermissionGuard(queue.dashboard.read) → "Dashboard" (secondary button, links to /queue/dashboard)
│                       + PermissionGuard(queue.create) → "Add Walk-in" button → AddToQueueModal
├── Filter bar
│   ├── Status select — "Board (Waiting / Called / In Service / Completed)" default,
│   │   or any single status (switches to flat-grid mode — see below)
│   └── Visit Date (date input)
├── LoadingState | ErrorState | EmptyState | Board-or-Grid   (mutually exclusive)
└── AddToQueueModal (conditional)
```

**View mode is derived from the Status filter, not a separate toggle:** leaving Status unset renders the 4-column board (Waiting/Called/In Service/Completed, each a client-side filter of one unpaginated fetch — capped at `limit: 100`, since "a day's board is meant to be seen at a glance," per the code's own comment); picking any one status (including Cancelled/No-Show/Skipped, which have no board column) switches to a flat responsive grid of that status's cards. This is a deliberate, reasonable design (not a gap) — it reuses one component (`QueueCard`) and one fetch for both the live-ops board and the ad-hoc history view, rather than building two screens.

### 2.1 Queue Card (`QueueCard`, used in both board and grid modes)

```text
QueueCard (bordered, 3px left accent = status color, see §5)
├── Top row: Queue Number (bold) ── Checked-in time (right-aligned, HH:MM)
├── Queue Type
├── Priority
└── Action row (buttons shown are a pure function of `status`, each PermissionGuard-gated):
    ├── WAITING | SKIPPED  → Call
    ├── CALLED             → Recall · Start · Open Visit (cross-module: emr.visit.create)
    ├── IN_SERVICE         → Complete
    ├── WAITING            → Skip · Cancel
    └── WAITING | CALLED | SKIPPED → Transfer
```

**Gap flagged:** the card shows Queue Number/Type/Priority/Time, not the patient or doctor name the original pre-verification draft assumed ("patient, doctor, wait duration" per that draft's Queue Board Sections). This is because the backend's `QueueResponseDto` only carries `patientId`/`doctorId`, not denormalized names (code comment in `QueueCard.tsx` confirms this is intentional — the component doesn't fabricate a name lookup rather than guess). **This is a real usability gap, not a stylistic choice**: front-desk and clinical staff need to see whose ticket a card represents without cross-referencing an ID. Flagged as the priority fix for this module (either denormalize name fields onto the response DTO, or have the frontend join against Patient/Doctor Master Data).

No wait-duration shown either (the pre-verification draft assumed this too) — only the absolute checked-in time, not an elapsed/live-updating duration. A live "waiting Xm" readout would need either polling or the WebSocket channel SAD §92–93 describes (Real-time Architecture / WebSocket Events) — not wired into this component today.

### 2.2 States (`ui-guidelines.md` §1)

| State | Shipped | Compliant? |
|---|---|---|
| Loading | `LoadingState` spinner (same cross-cutting gap as Master Data/Reservation) | Gap |
| Empty | `EmptyState title="Queue is empty" description="No entries match your current filters."` — has description, no action | Partial (same pattern as Reservation List) |
| Error | `ErrorState` + retry | Compliant |

### 2.3 Status color — see `design-system.md` §8.2

The full `WAITING/CALLED/IN_SERVICE/COMPLETED/CANCELLED/NO_SHOW/SKIPPED` → token mapping now lives in `design-system.md` §8.2 (added this pass; the module's original 5-status assumption in the pre-verification draft was incomplete). **The most significant gap this pass surfaced:** the mapping is defined in code (`QUEUE_STATUS_TONE`) but never actually rendered as a `Badge` — see design-system.md §8.2 for the full writeup. `QueueCard` communicates status only via an unlabeled border-accent color, which fails `ui-guidelines.md` §3's "status is always a colored pill" rule and `design-system.md` §9's "never color-only status communication." Concretely: in board view the column header supplies the missing label; in flat-grid view (i.e., viewing Cancelled/No-Show/Skipped history) **there is no status label on screen at all**.

---

## 3. Add Walk-in (`AddToQueueModal`)

Modal-not-full-page, correctly so per `ui-guidelines.md` §4 (3 fields, single-entity action). Fields:

| Field | Type | Required |
|---|---|---|
| Patient | autocomplete picker (`PatientPicker`, shared with Reservation) | ✔ |
| Doctor | select | ✔ |
| Emergency priority | checkbox | — |

This is the shipped equivalent of the SAD's "Walk-In Queue Flow" (§34) — creates a Queue entry directly (no Reservation record first), matching SAD Rule 8 ("Patient Walk-In harus memiliki Visit Date hari ini" — implicit since there's no date field, it's always today) and the Priority Order in SAD §20 (Emergency > VIP > Reservation > Walk-in — the checkbox is this module's only lever into that ordering; VIP has no UI affordance at all, flagged as unimplemented, not silently assumed present).

## 4. Skip / Cancel / Transfer modals

| Modal | Fields | Reason required? | SAD alignment |
|---|---|---|---|
| Skip (`QueueReasonModal`) | Reason (textarea) | Optional | SAD §38 doesn't mandate a reason for Skip; shipped matches |
| Cancel (`QueueReasonModal`, same component) | Reason (textarea) | **Optional** | **Gap worth flagging, not silently fixed:** SAD business rules don't explicitly mandate a Cancel reason for Queue the way they do for Reservation Cancel (§7.4) — but Queue Cancel is also irreversible (Rule 6: no physical delete; a cancelled ticket doesn't return to Waiting) and financially/operationally adjacent to Billing (Rule 10: Billing only after Completed, so a bad Cancel has downstream effects). Worth an explicit product decision on whether Queue Cancel's reason should be made mandatory like Reservation's, rather than leaving the two Cancel flows inconsistently required/optional across modules. |
| Transfer (`TransferQueueModal`) | New Doctor (select, excludes current doctor) + Reason (textarea) | **Required** | Not in SAD's explicit rule list but reasonably extended — a doctor reassignment mid-queue is consequential enough to warrant it, consistent with how task-162/Reservation Cancel treat mandatory reasons |

Each of these follows `ui-guidelines.md` §4 correctly (modal, not full page — all ≤ 2 fields).

---

## 5. Queue Dashboard (`/queue/dashboard`)

```text
Queue Dashboard
├── H1 "Queue Dashboard"
├── Status summary row (6 StatCards): Waiting / Called / In Service / Completed / Cancelled / No Show
├── Branch summary row (4 StatCards): Total Patients Today / Avg. Waiting (min) / Avg. Service (min) / Completion Rate (%)
└── "Queue by Doctor" table: Doctor ID, Queue Count (EmptyState "No doctor activity yet today" if none)
```

**Gap flagged, with reason already documented in code:** SAD §27 "Queue Dashboard Metrics" additionally specifies Doctor Active/Idle status and Queue Capacity; these are intentionally omitted (code comment: `apps/backend`'s `QueueDashboardResponseDto` has no real-time doctor-presence tracking or branch max-queue config in the Phase 1 schema — not a frontend oversight, a backend data-availability constraint).

**Further gap vs. SAD §35:** the SAD describes three distinct dashboard *views* — Registration Dashboard (Waiting/Called/Completed/Cancelled), Doctor Dashboard (Next Patient/Waiting Queue/Estimated Waiting Time), Manager Dashboard (Total Queue/Average Waiting/Doctor Performance/Branch Performance). Shipped has **one** dashboard that's closest to the Manager view; there's no Doctor-specific "who's next for me" view and no distinct Registration-desk view. Given `navigation.md` §2 assigns Reporting/Dashboard access broadly to Owner/Clinic Manager, and Doctors already get their queue via the board's Call/Recall/Start buttons directly, this single-dashboard consolidation is a defensible simplification — but it should be a confirmed decision, not an assumed one; flagged for the user to confirm before more dashboard variants get built elsewhere in the app on the same unstated assumption.

The "Queue by Doctor" table shows raw `Doctor ID`, not a name — same root cause as §2.1's card gap (no denormalized name in the response DTO); a `doctorName` join/lookup would fix both at once.

States: `LoadingState`/`ErrorState` at the page level (same spinner/no-skeleton gap); no page-level Empty state (the page always has *some* data — zero counts render as "0", which is itself a reasonable zero-state, not a true empty condition) but the "Queue by Doctor" table does have its own section-level `EmptyState`, consistent with the finer-grained pattern also used in Reservation Analytics (`reservation.md` §5).

---

## 6. RBAC (SAD §65.2–65.3, cross-checked against shipped permission strings)

| Role | Create | Call | Recall | Start | Skip | Transfer | Cancel | Complete | View Dashboard |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Administrator | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Clinic Manager | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Registration Staff | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ | ✔ |
| Doctor | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | ✔ |
| Nurse | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | ✔ |
| Cashier | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (Completed only, per §65.2 "View Completed Queue") |
| Owner | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (Dashboard & Reporting) |

Shipped permission strings (`queue.call`, `queue.recall`, `queue.start`, `queue.complete`, `queue.skip`, `queue.cancel`, `queue.transfer`, `queue.create`, `queue.dashboard.read`) map cleanly onto SAD §65.3's action list (`Start` isn't broken out as its own §65.3 matrix row, but is named explicitly in §65.2's Doctor/Nurse permission description — consistent, not a gap). All enforcement is `PermissionGuard` hidden-not-disabled, matching the pattern established in Master Data/Reservation.

**Gap flagged:** SAD §65.4 (Branch Isolation) requires every Queue query to filter by `branch_id` server-side — correctly a backend concern, not a frontend one, but nothing in the shipped filter bar lets a multi-branch-scoped user (e.g. Administrator) switch which branch's board they're viewing. Not fabricated as present; flagged as an open question for whichever role can see more than one branch's queue.

---

## 7. Navigation

**Entry points (CONFIRMED against `apps/frontend/config/navigation.ts`):** Sidebar "Queue" is a single top-level link to `/queue`, `permission: "queue.read"` — no sidebar sub-item for Dashboard; it's reached only via the in-page "Dashboard" button (§2's header). Reservation Detail's Check-in action is the other entry surface into Queue (creates the ticket that then appears on this board) — see `reservation.md` §7's flagged gap that no post-check-in link jumps straight to the new ticket.

**Exit points:** `QueueCard`'s "Open Visit" button (CALLED status, `emr.visit.create` permission) is the bridge into EMR — and per `navigation.ts`'s own comment, it is **the only way into EMR at all**: there is no standalone EMR sidebar entry, because the backend has no Visit List endpoint (task-048–053 never added one). This is a significant fact for the upcoming EMR page spec, not just a Queue-module note. Completed tickets are the precondition for Billing (Rule 10) but there's no direct "Create Invoice" link from a Completed card today; Billing is presumably reached through its own sidebar entry (`/billing`) once a Visit is closed.

## 8. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

This module gets the largest interactivity investment of any page spec in this pass, for two independent reasons: it's the natural home of **drag-and-drop** (a literal 4-column board already exists, §2), and it's where this design system's single worst-flagged accessibility gap lives (§2.3 / `design-system.md` §8.2's "no badge actually renders the status mapping" finding from the verification pass).

- **Drag-and-drop** (`design-system.md` §11.2, `ui-guidelines.md` §9.4): `QueueCard`s become draggable between the 4 board columns (Waiting→Called→In Service→Completed), settling into position with `motion-complex`. Every drag has a non-drag equivalent — the existing Call/Recall/Start/Complete buttons (§2.1) stay exactly as they are, not replaced. Invalid drops (e.g. dragging a `COMPLETED` card back to `WAITING`, which SAD Rule 5/9 forbid) show a blocked cursor on hover-over the invalid column, never a drop-then-error round-trip. This is also the natural moment to fix the missing-name gap (§2.1) if it's addressed in the same pass — a draggable card with no patient name is a worse interaction than a static one.
- **Fixing the status-badge gap, concurrently**: rebuilding `QueueCard` for drag support is the natural moment to also wire `QUEUE_STATUS_TONE` into an actual `Badge` on the card (per `design-system.md` §8.2's explicit recommendation) — do both in one pass, not two, since both touch the same component.
- **Live update** (`ui-guidelines.md` §9.2): the board should reflect another user's Call/Complete/Transfer action without a manual refresh — new tickets slide into their column from the top, status changes cross-fade, and per §9.2's rule, a live update never yanks scroll position or focus away from a ticket the current user is mid-interaction with (e.g. mid-drag, or with a Skip/Cancel/Transfer modal open on it).
- **Micro-interactions**: card hover gets a `motion-micro` lift (subtle shadow + 1.02× scale) signaling draggability before the user even picks it up; the Dashboard's StatCards (§5) get a brief count-up animation on value change rather than an instant digit swap, consistent with `design-system.md` §11.7.
- **Not applicable here**: inline edit (nothing on a queue ticket is a simple corrigible field) and the interactive odontogram (EMR-only, §11.5) — noted for completeness, not every module needs every one of the 6 requirements.
