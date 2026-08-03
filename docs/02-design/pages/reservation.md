# Pages: Reservation Module

> Status: **Verified against shipped code** (Phase 1, task-002/031-036). `docs/03-sad/13-module-reservation.md` has its own §33 "User Interface Guidelines" (screens, list columns, quick actions, a literal color standard) — unlike Master Data, this is a real source spec, not purely PRD-derived, though it predates and partly conflicts with what shipped (see §5). Sourced from SAD §6 (status lifecycle), §7 (business rules), §12–18 (create/update/search/schedule-validation/walk-in/reschedule-cancel), §26 (permission matrix), §33 (UI guidelines), cross-checked against `apps/frontend/features/reservation/`.

---

## 1. Page Inventory

| Page | Route | Purpose | SAD source |
|---|---|---|---|
| Reservation List | `/reservations` | Search/filter/paginate all reservations | §33.2, §14 |
| Create Reservation | `/reservations/new` | Book an appointment **or** register a walk-in (single form, toggle) | §12, §17 |
| Reservation Detail | `/reservations/{id}` | Full record + Check-in/Reschedule/Cancel actions | §33.2 |
| Reservation Analytics | `/reservations/analytics` | KPI + trend dashboard (task-060) | Not in SAD §33 — see §6 below |

**Gap flagged:** SAD §33.2 also lists "Edit Reservation", "Doctor Schedule" (standalone), "Time Slot Selection" (standalone), and "Reservation History" (per-patient) as distinct screens. What shipped folds Edit into the Detail page's Reschedule modal (no separate edit-arbitrary-field screen — only date/time can change post-creation, matching §13.3's restriction that a reservation can't be touched once Checked-in/Queued/In-Treatment/Completed/Cancelled anyway), and folds Doctor Schedule + Time Slot Selection into one inline `TimeSlotPicker` used by both Create and Reschedule rather than a standalone screen. Reservation History (per-patient) is not built as a Reservation-module screen — it appears instead inside Patient Detail's own tabs (`docs/02-design/pages/patient.md` §12.2 lists "Reservation History" as a Patient Detail tab). These are reasonable consolidations, not missing functionality, but the mapping from "8 SAD screens" to "4 shipped routes" should be explicit rather than silently assumed 1:1.

---

## 2. Reservation List (`/reservations`)

### Layout

```text
Reservation List
├── Header: H1 "Reservations" + PermissionGuard(reservation.create) → "New Reservation" (links to /reservations/new)
├── Filter bar (flex-wrap row)
│   ├── Search input — reservation number / complaint text (placeholder: "Search reservation no. / complaint...")
│   ├── Status select — all 8 statuses (see design-system.md §8.1), "All statuses" default
│   ├── Date From (date input)
│   └── Date To (date input)
├── LoadingState | ErrorState | EmptyState | Table   (mutually exclusive, see §2.2)
└── Pagination (page-number based, not infinite scroll)
```

Every filter change resets `page` to 1 (`setFilters` merges `{ page: 1 }` on each control) — prevents landing on an out-of-range page after narrowing results.

### 2.1 Table columns (as shipped vs. SAD §33.3)

| Column | Shipped | SAD §33.3 |
|---|---|---|
| Reservation Number | ✔ | ✔ |
| Date | ✔ | ✔ |
| Time | ✔ | ✔ |
| Type | ✔ | ✔ (Reservation Type) |
| Status | ✔ (Badge, see design-system.md §8.1) | ✔ |
| Patient Name | **✖ — gap** | ✔ |
| Medical Record Number | **✖ — gap** | ✔ |
| Doctor | **✖ — gap** | ✔ |
| Source | **✖ — gap** | ✔ |
| Created By | **✖ — gap** | ✔ |

**Gap flagged:** the shipped table is missing Patient Name, MRN, Doctor, Source, and Created By — five of SAD §33.3's ten specified columns. Front-desk staff currently cannot identify *whose* reservation a row belongs to from the list without opening Detail. This is the most consequential gap in this module's spec vs. implementation and should be prioritized.

Row actions: "View" (always, links to Detail) + "Check In" (conditional on `PermissionGuard(reservation.check-in)` **and** status ∈ `{BOOKED, CONFIRMED}` — an inline quick-action, not requiring a Detail-page visit first). SAD §33.4 additionally lists Edit/Reschedule/Cancel/Print as row-level quick actions; shipped only exposes Check-in inline, routing Reschedule/Cancel/Edit through the Detail page instead — a legitimate "modal vs. full page" judgment call per `ui-guidelines.md` §4 (these need more than 6 fields' worth of context — date/time slot picker isn't a quick inline edit), but worth naming since it's a narrower action set than §33.4 specifies. Print is explicitly Future scope (SAD §33.4 itself marks it "(Future)").

### 2.2 States (`ui-guidelines.md` §1)

| State | Shipped | Compliant? |
|---|---|---|
| Loading | `LoadingState` spinner-only (same shared component as Master Data — see `master-data.md` §3 for the cross-cutting skeleton-vs-spinner gap) | Gap (same root cause as Master Data) |
| Empty | `EmptyState title="No reservations found" description="Try adjusting your search or filters."` — has a description, but no primary action | Partial — better than Master Data's (has a description) but still missing the create action `ui-guidelines.md` §1 requires |
| Error | `ErrorState` + retry | Compliant |

### 2.3 Table/list behavior (`ui-guidelines.md` §3)

| Requirement | Shipped | Compliant? |
|---|---|---|
| Search | ✔ — reservation number / complaint | Compliant |
| Filter | ✔ — status, date range (two filters, exceeds the "at least one" bar) | Compliant |
| Sort | **✖** — SAD §14.3 specifies 5 sortable fields (Date, Time, Patient Name, Created Date, Doctor Name); none wired | **Gap** |
| Pagination | ✔ — page-based `Pagination` component, SAD §14.4's 20/50/100 default not confirmed as selectable (only page number shown) | Partial — paginated, but the page-size selector from §14.4 isn't visibly wired |
| Row actions icon+tooltip, overflow past 3 | Text links, 1–2 actions (under threshold, but wrong control type — same pattern as Master Data) | Partial gap |
| Status as colored pill | ✔ — `Badge` per design-system.md §8.1 | Compliant |

---

## 3. Create Reservation (`/reservations/new`)

### Layout

Single-page form (no stepper) — consistent with SAD §33.6 "Form maksimal 1 halaman" and `ui-guidelines.md` §2 (only steppers for genuinely complex multi-stage entry; this form tops out at 9 fields and most are conditional).

```text
Create Reservation (max-w-2xl form)
├── Walk-in toggle (checkbox) — "Walk-in (no appointment slot needed)"
│   Selecting this hides Date/Time/Type/Source and forces
│   reservationType=WALK_IN, source=WALK_IN server-side (task-002:
│   one POST /reservations backs both flows, dispatched by these fields)
├── Patient — PatientPicker (autocomplete search-and-select, satisfies
│   SAD §33.6 "Gunakan pencarian pasien dengan autocomplete")
├── Doctor — Select, populated from Master Data's Doctor catalog
├── [if not Walk-in] Date — date input; resets Time Slot on change
├── [if not Walk-in, and Doctor+Date chosen] Time Slot — TimeSlotPicker
│   grid (4 cols mobile / 6 cols desktop), real-time availability
│   (SAD §33.6 "real-time"), FULL slots rendered disabled not hidden
│   (so staff can see the day is fully booked, task-036 code comment)
├── [if not Walk-in] Reservation Type — Select (Appointment/Follow
│   Up/Emergency/Consultation; Walk-in itself is not a selectable
│   option here since the toggle above already covers it)
├── [if not Walk-in] Source — Select (Phone/WhatsApp/Website/Mobile
│   App) — note: SAD §9 lists WhatsApp/Portal/Mobile as "Future"
│   sources but the shipped Select already offers them as choices;
│   flagged, not fixed — confirm with the user whether these should
│   be disabled until those intake channels actually exist
├── Complaint — Textarea, optional
├── Notes — Textarea, optional
└── Submit — label switches "Register Walk-in" / "Book Reservation"
    based on the toggle; disabled until required fields are filled
```

### 3.1 Forms (`ui-guidelines.md` §2)

| Field | Type | Required | Notes |
|---|---|---|---|
| Walk-in | boolean | — | Toggles the whole conditional field set |
| Patient | autocomplete picker | ✔ | |
| Doctor | select | ✔ | |
| Date | date | ✔ (unless Walk-in) | Clears Time Slot on change |
| Time Slot | slot grid | ✔ (unless Walk-in) | Not a free-text field — selection-only |
| Reservation Type | select | (defaults to Appointment) | |
| Source | select | (defaults to Phone) | |
| Complaint | textarea | optional | |
| Notes | textarea | optional | |

| Guideline requirement | Shipped | Compliant? |
|---|---|---|
| Blur validation with inline error text | `required` HTML attribute + a disabled Submit button (`canSubmit` gate) until required fields are filled — no inline per-field error text, but the disabled-submit pattern arguably achieves the same "can't submit invalid" goal through a different, arguably better-suited mechanism for this form (prevents a wasted round-trip entirely rather than erroring after) | Partial — different mechanism, same outcome; not the literal blur-validation pattern, worth a decision on whether to standardize |
| Money fields formatted | N/A — no money field on this form | Compliant (not applicable) |

No confirm-modal on submit (not a destructive action, so `ui-guidelines.md` §2's confirm-modal rule doesn't apply here — correctly so).

---

## 4. Reservation Detail (`/reservations/{id}`)

```text
Reservation Detail
├── Header: reservation number (H1) + status Badge
├── Action bar (visible only when canModify — status ∈ {BOOKED, CONFIRMED},
│   matching SAD §13.3's restriction list collapsed to "still open")
│   ├── PermissionGuard(reservation.check-in) → "Check In" button
│   ├── PermissionGuard(reservation.reschedule) → "Reschedule" button (secondary) → opens RescheduleModal
│   └── PermissionGuard(reservation.cancel) → "Cancel" button (danger) → opens CancelReservationModal
├── Definition list (2-col grid on sm+): Date, Time, Type, Source,
│   Complaint, Notes, Checked In At, [Cancellation Reason if CANCELLED]
├── RescheduleModal (conditional) — New Date + TimeSlotPicker, "Confirm Reschedule"
└── CancelReservationModal (conditional) — Reason Textarea (required),
    "Confirm Cancellation" (danger variant)
```

**Gap flagged against SAD §33.2:** no "Status Timeline" section (the earlier pre-verification draft of this doc assumed one existed, describing "Status Timeline (Booked → Confirmed → Checked-in → Completed / Cancelled)" — that was never built and isn't in the shipped `ReservationDetailView`). SAD §27 (Audit Trail) implies every status transition is logged, but nothing in this Detail page surfaces that history to the user. Flagged, not fabricated as present.

### 4.1 Forms — Reschedule / Cancel (`ui-guidelines.md` §2)

| Modal | Fields | Confirm pattern |
|---|---|---|
| Reschedule | New Date (date), Time Slot (grid, populated once date chosen) | Plain confirm button, no typed-reason requirement — reschedule isn't in `business-rules.md`'s "Void, Refund, Adjustment, Period Reopen" irreversible-action list, so no confirm-modal-with-restated-consequence is required per §2; the modal itself already is the confirm step |
| Cancel | Reason (textarea, **required** — submit disabled until non-empty) | `variant="danger"` button + required reason field. This satisfies SAD §18.2/§7.4 ("Alasan pembatalan wajib diisi") and is consistent with `ui-guidelines.md` §2's typed-reason requirement, even though Cancel isn't in that section's literal example list — appropriately extended here since it's a real irreversible-once-Checked-in state transition |

---

## 5. Reservation Analytics (`/reservations/analytics`) — undocumented in SAD §33

`ui-guidelines.md`/SAD gap: this page exists in shipped code (task-060) with no `docs/02-design` page spec and no SAD UI section covering it — the code's own comment flags this explicitly. Documenting what shipped so it's no longer un-specced:

```text
Reservation Analytics
├── Header: H1 "Reservation Analytics" + Date From / Date To inputs
├── KPI row (4 Cards): Total / Daily / Weekly / Monthly Reservations
├── 2-col Card row: Appointment Conversion % (+ completed/total), Walk-in Ratio % (+ walk-in/total)
├── Card: Reservation Trend — proportional bar list by date
├── Card: Peak Hour Analysis — proportional bar list by hour
├── Card: Doctor Utilization — proportional bar list by doctor name
└── 2-col Card row: Cancellation Trend, No Show Trend — proportional bar lists
```

**Deliberate constraint, not a gap:** trends render as proportional horizontal bar lists (`BarList`), not a charting library — per the code's own comment, `docs/04-ai-contract/01-global-rules.md` forbids adding a new library without explicit approval, and no charting library has been approved. If richer visualization (line/area charts) is wanted for this page, that requires an explicit library-approval decision from the user first, not a silent addition during a design pass.

States: `LoadingState` (spinner), `ErrorState` (+ retry) — no dedicated Empty state at the page level, but each `BarList` independently renders `EmptyState title="No data for this range"` per section, which is a finer-grained empty pattern than Master Data/List use elsewhere (worth propagating that per-section-empty pattern to other dashboards later, not a gap here).

Permission: gated by `reservation.analytics.read` (nav config) — a permission code not listed in SAD §26.2's Permission List (which only has `.view/.create/.update/.cancel/.reschedule/.checkin/.delete/.export`). Extrapolated the same way Master Data's `finance.account-mapping.*` was in task-162 — flagged, not silently treated as SAD-specified.

---

## 6. RBAC (SAD §26.3, cross-checked against shipped permission strings)

| Role | View | Create | Update | Cancel | Reschedule | Check-in | Export |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Administrator | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Registration Staff | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Clinic Manager | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Doctor | ✔ (read only) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Nurse | ✔ (read only) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Cashier | ✔ (read only) | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |

**Permission-string naming gap (cosmetic, not functional):** SAD §26.2 specifies `reservation.view` / `reservation.checkin`; shipped code uses `reservation.read` / `reservation.check-in` (nav config, `PermissionGuard` call sites). Same for `reservation.analytics.read`, which has no SAD-listed equivalent at all (see §5). These are naming drift, not missing enforcement — every permission concept in §26.2 has a working equivalent — but exact strings should be reconciled with the System module's permission catalog (per `docs/03-sad/21-module-system.md`) so seed data / docs / code all agree on one literal string per permission.

Enforcement pattern matches Master Data: hidden-not-disabled via `PermissionGuard`, sidebar visibility via `hasPermission`, server-side authorization independent and authoritative (`ui-guidelines.md` §5).

---

## 7. Navigation

**Entry points:** Sidebar "Reservation" section (List, Analytics — 2 sub-items per `apps/frontend/config/navigation.ts`, confirmed structure below). Patient Detail's own "Reservation History" tab is a second entry surface into reservation data, scoped to one patient (`patient.md` §12.2) — not a separate Reservation-module screen.

**Exit points:** Reservation Detail → Check-in transitions the record into the Queue module (SAD §29 Integration with Queue Module: Check-in generates a Queue entry) — no explicit "go to Queue board" link shown after check-in yet; flagged as a possible UX gap (staff must navigate to Queue manually to see the entry they just created).

**`navigation.md` §4 correction (this pass):** replacing the proposed 5-item Reservation tree (`Reservation List / Create Reservation / Doctor Schedule / Availability / Reservation Timeline / Reservation History`) with the verified 2-item shipped structure — see the corresponding edit to `navigation.md` §4.

## 8. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**Live update** is this module's headline fit: `TimeSlotPicker` (§3) currently fetches slots once per doctor/date selection — a slot going from Available to Full because another staff member just booked it should be reflected without the user re-selecting the date, per `ui-guidelines.md` §9.2 (poll/subscribe, animate the diff, don't silently re-render). This directly prevents the double-booking race condition SAD §15.4 already treats as a rejectable error — catching it live, before submit, is strictly better than the current reject-after-submit behavior. **Interactive charts** (§5, `design-system.md` §11.4): Reservation Analytics's proportional `BarList`s (Reservation Trend, Peak Hour Analysis, Doctor Utilization, Cancellation/No-Show Trends) upgrade to Recharts, now that it's approved — each retains its "View as table" toggle (`ui-guidelines.md` §9.5) and animates on date-range filter change rather than hard-cutting. **Micro-interactions**: status pill transitions on the List/Detail Badge (§2.1, §4) cross-fade over `motion-standard` when a reservation's status changes (e.g. after Check-in) rather than an instant swap — same pattern `design-system.md` §11.7 establishes generally, concretely useful here since Check-in is this module's most common state transition.
