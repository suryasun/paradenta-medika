# UI Guidelines — Parakita Medika

> Status: **resolved, extended for 2026 (§9)**. Replaces the earlier gap report. The binding constraints listed there (Loading/Empty/Error states, RBAC-aware UI, no client-side-only enforcement, responsive layout) are restated below with concrete patterns, per `docs/02-design/design-system.md` and the module PRDs in `docs/01-prd/`. §9 is new this revision — the behavioral counterpart to `design-system.md` §11's motion/interactivity tokens.

## 1. Page states (mandatory on every list/detail page)

- **Loading** — skeleton rows matching the real row height/columns (not a spinner-only overlay) for tables; a skeleton card grid for dashboards.
- **Empty** — an icon-free, single-sentence message + the primary create action (e.g. "Belum ada pasien terdaftar — Registrasi pasien pertama"). Never show an empty table with just column headers.
- **Error** — the `Alert` component (severity=error) with a retry action; never a raw stack trace or blank page.

## 2. Forms

- Inline validation on blur, not only on submit. Error text sits directly under the field in `--color-error-error-700` (light) / `-300` (dark), 12px.
- Multi-step forms (patient registration, PO approval, payroll run) use the Horizontal/Vertical Stepper — never a single 20-field form.
- Destructive or financially irreversible actions (Void Invoice, Delete Master Data, Terminate Employee, Reopen Closed Period) always confirm via a modal dialog that restates the consequence in one sentence and requires a typed reason where the business rule mandates one (Void, Refund, Adjustment, Period Reopen — see `docs/01-prd/business-rules.md`).
- Money fields are always right-aligned, 2-decimal, `Rp` prefixed, and never accept free-typed thousand separators — format on blur.

## 3. Tables

- Every data table has: search, at least one filter (branch/date/status as relevant), sort on sortable columns, and pagination (never infinite scroll for financial/clinical records — page numbers are auditable).
- Row actions are icon buttons with a tooltip, collapsed into an overflow menu past 3 actions.
- Status is always a colored pill (see design-system.md §8), never a plain text cell.

## 4. Modals vs. full page

- Modal: quick, single-entity actions with ≤ 6 fields (cancel reservation, add discount, quick edit).
- Full page: anything with a stepper, a tab set, or that benefits from a URL (Patient Detail, Payroll Run, Stock Opname).

## 5. RBAC in the UI

Per `docs/02-design/navigation.md` and `docs/03-sad/21-module-system.md`: **menu and action visibility is convenience only** — hide/disable what the current user's role/permission does not allow, but every server call is independently authorized. Concretely:

- Sidebar sections render only for roles mapped in `navigation.md` §2.
- A disabled (not hidden) action — e.g. a Kasir seeing a greyed "Post Journal" button — is preferable to hiding it when the user needs to understand the workflow exists but isn't theirs; use hidden when the module itself is entirely out of the user's scope.
- The Owner/Dokter/Kasir role switcher in `Parakita - Key Screens.dc.html` demonstrates this: sidebar contents change per role, never just an icon dimming.

## 6. Responsive layout

Primary target is desktop/tablet (clinic front-desk and back-office workstations); the sidebar collapses to icon-only under 1024px and to an overlay drawer under 768px. No phone-first layout is required for this release (confirm with the user if a tablet check-in kiosk or clinician mobile view is planned later).

## 7. Accessibility

WCAG 2.1 AA (see design-system.md §9). Minimum 44×44px hit targets on touch-capable clinic devices (check-in kiosk, tablet EMR). Keyboard focus is always visible; never `outline: none` without a replacement ring.

## 8. Copy tone

English language for all product labels, actions, and messages (clinic staff-facing); technical/system terms (module names in code, API fields, status enum values like `BOOKED`/`WAITING`) stay in English since they mirror the SAD's domain language 1:1 — this avoids translation drift between UI copy and backend contracts.

## 9. Interactivity patterns (new — 2026 revision)

Behavioral rules for the six named interactivity requirements. Shared motion tokens (`motion-micro/standard/complex`) and the drag/inline-edit/chart/odontogram *foundations* are defined in `design-system.md` §11 — this section is when-to-use-what, not the tokens themselves.

### 9.1 Micro-interactions

Every interactive element (button, row action, status pill, form field) has a hover *and* a focus state, not hover-only — clinic desktop users tab through forms constantly (registration, EMR) and a hover-only affordance is invisible to them. Press states use `motion-micro` (design-system.md §11.1); never rely on cursor changes alone as the only feedback for clickability. Micro-interactions are additive polish — a screen must be fully usable with every optional animation disabled (§9.6), so never encode information (e.g. "this row is now editable") in an animation alone without a persistent visual cue too (an edit icon, a border change) that survives with motion off.

### 9.2 Live update

Applies to: Queue board (tickets appearing/changing status from other users' actions), Dashboard KPI cards, any screen showing data another concurrent user is actively changing (Financial Period status during a close, Stock levels during concurrent Goods Receipt posting). Pattern: **poll or subscribe (mechanism is a backend/infra decision, not specified here) and animate the diff, don't just silently re-render** — a card that changed status cross-fades (`motion-standard`) rather than popping; a new card entering the board slides in from the top of its column rather than appearing instantly; a removed/moved card doesn't leave a jarring gap (siblings reflow with `motion-standard`). Never auto-scroll or auto-reorder a list a user is actively reading/interacting with because of a live update from someone else — queue that change and show a subtle "N updates available" affordance instead, consistent with not stealing focus/scroll position out from under an active user (this is the live-update equivalent of never disrupting form input mid-edit).

### 9.3 Inline edit

Trigger is a dedicated pencil/edit icon that appears on row hover *and* is always visible on keyboard focus (never hover-only, per §9.1) — not click-anywhere-in-the-cell, which conflicts with text selection and row-click-to-view-detail patterns already established across every list table in this app. See `design-system.md` §11.3 for the commit/revert/error pattern. Only for single-field, non-destructive, low-validation-complexity edits (a name, a code before first use, a boolean toggle) — anything else stays the existing modal/full-page pattern (§4).

### 9.4 Drag-and-drop

See `design-system.md` §11.2 for the visual pattern. Behaviorally: a drag operation is exploratory until dropped — nothing commits to the server until drop, and an invalid drop target (e.g. dragging a `COMPLETED` Queue card back to `WAITING`, which `queue.md` §2's business rules forbid) shows a blocked-cursor state on hover-over rather than allowing the drop and then erroring, matching the "prevent, don't just reject" principle already used elsewhere (e.g. Reservation's `TimeSlotPicker` disabling FULL slots rather than allowing selection then rejecting).

### 9.5 Interactive charts

See `design-system.md` §11.4 for the token/library specifics (Recharts). Behaviorally: every chart has a keyboard-reachable "View as table" toggle (data must never be mouse-hover-only accessible); filter changes (date range, branch) animate the transition between data sets rather than hard-cutting, so a user can visually track what changed; a chart never substitutes for the underlying report's existing table view — it sits above/alongside it, per every report page spec's existing table-first structure (`finance.md` §10, `warehouse.md` §12).

### 9.6 Reduced motion (binding floor, not a preference)

`prefers-reduced-motion: reduce` must be honored everywhere §9.1–9.5 introduce motion — see `design-system.md` §11.6 for the concrete per-pattern fallback. This is part of this file's WCAG 2.1 AA commitment (§7), not a separate nice-to-have: a user with vestibular sensitivity must be able to use every feature in this section with motion fully suppressed and lose zero functionality, only the transition polish.
