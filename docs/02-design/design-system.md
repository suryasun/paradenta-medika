# Design System — Parakita Medika

> Status: **resolved, refreshed for 2026**. Original source: the attached Figma file `materialize-figma-admin-dashboard-uikit-v4` (Materialize Admin Dashboard UI Kit), re-themed for a dental clinic product — component **structure** (100–900 color ramps, 4px spacing scale, 5-step radius scale, 2-tier elevation model) is retained unchanged from that origin. This revision refreshes the **values** inside that structure — hue, typeface, icon set, and adds a formal Motion & Interactivity layer — per a 2026 dental/health-tech visual direction, plus 6 named interactivity requirements (micro-interactions, live update, drag-and-drop, inline edit, interactive charts, interactive odontogram) that are new to this revision. No token role was renamed, removed, or restructured; every page spec written against the previous hue values (`pages/*.md`, all cross-referencing §8's status-token roles) remains valid without edits, since those specs reference roles (Primary/Success/Warning/Error/Info/Neutral) not literal hex values.

Live references (this project):
- `Parakita - Design System.dc.html` — foundations (color, type, spacing, radius) + component gallery, with a light/dark toggle. **Needs a values-only update to match this revision** — token names unchanged, hex/font/icon values need to be swapped in (see §2–§3, §7).
- `Parakita - Key Screens.dc.html` — Dashboard, Patient List, Patient Detail, Queue Board mockups with a role switcher (Owner / Dokter / Kasir) and dark mode. Same values-only update applies.
- `components/Components.bundle.js` + `Components.d.ts` — the materialized source components (usable directly in React/Next.js).
- `components/fig-tokens.css` — original Figma Variables as CSS custom properties (structure/scale) — unchanged by this revision.
- `components/dental-tokens.css` — the dental-clinic re-theme; **load after** `fig-tokens.css` so it overrides the base color ramps. Ramp *values* inside this file need updating per §2; ramp *structure* does not change.

---

## 1. Brand direction

**Clinical, but drawn from dentistry's own materials, not generic medical-admin blue.** The previous direction (flat teal on cold white) was correct in tone (calm, trustworthy, operations-dense) but had no connection to the actual subject — nothing in it came from dentistry. This revision keeps the tone and swaps the material references: a warm porcelain/enamel background instead of clinical-sterile white, a jade accent (the color of a dental instrument tray, not a generic corporate teal), and — the one place this system spends its aesthetic risk — a live, interactive odontogram as the product's visual signature (§7, §11). Everything else stays quiet and disciplined around that one element, per the "spend your boldness in one place" principle: dense data tables, calm neutral chrome, no competing decoration.

Still first-class dark mode, still condensed data density suited to an operations-heavy admin app (tables, forms, KPI cards) rather than a marketing site.

## 2. Color

Token **structure** (100–900 ramps per role, `-main/-light/-dark`, `-opacity-*` states, `theme-*` action/text roles, `dark-*` mode overrides) is unchanged. Hue values refreshed:

| Role | Base (500) | Usage |
|---|---|---|
| Primary (jade) | `rgb(14,147,128)` / `#0E9380` | Primary actions, active nav, links, brand mark — same teal family as before, more saturated and confident |
| Secondary (warm graphite) | `rgb(100,114,111)` / `#64726F` | Secondary buttons, muted UI chrome — warmed slightly off the previous cool slate to pair with the porcelain background |
| Success (sage) | `rgb(75,155,110)` / `#4B9B6E` | Paid, completed, active, on-target KPIs |
| Warning (honey) | `rgb(219,154,52)` / `#DB9A34` | Waiting, low stock, pending approval |
| Error (coral) | `rgb(225,91,82)` / `#E15B52` | Void, cancelled, overdue, destructive actions |
| Info (cornflower) | `rgb(76,123,224)` / `#4C7BE0` | Booked, informational states — kept visually distinct from primary jade |

Each role still carries a full 100–900 ramp in `dental-tokens.css`; same usage convention as before (100–200 tinted backgrounds, 500 base, 700 text-on-tint light mode, 300 text-on-tint dark mode — §6).

**Neutral/background tokens refreshed** (previously "unchanged from the source kit" — this revision is the first to touch them, deliberately):

| Token | Light | Dark |
|---|---|---|
| `--misc-body-bg` | `#FBFAF6` (porcelain — warm off-white, the color of enamel, not clinical sterile white) | `#12161C` (warm ink navy, not pure black) |
| `--misc-paper` | `#FFFFFF` | `#181D24` |
| `--theme-text-primary` | `#151B22` (warm ink navy) | `#F3F1EC` |
| `--theme-text-secondary` | `#5B6560` | `#9CA6A2` |
| `--theme-divider` | `#E7E3DA` | `#262C33` |

**Calibration note (why this isn't the generic AI palette):** the obvious version of "warm off-white background" pairs it with a high-contrast serif display face — that's a recognizable default, not a choice, and explicitly avoided here (§3 uses a geometric sans for display, never a serif). This palette is warm-neutral + jade + a sans display + rounded data-driven icons (§7) — a combination anchored in dental materials (porcelain, enamel, instrument-tray jade), not a template.

## 3. Typography

**Two roles, not one** (previous revision used Inter alone for everything):

| Role | Face | Usage |
|---|---|---|
| Display | A geometric sans with more character than Inter (e.g. General Sans / Switzer family) | **H1/page title only** — used with restraint, exactly one instance per page, never body text |
| Body / UI | Inter | Everything else — headings below H1, forms, tables, nav. Retained because it's genuinely correct for table-dense admin UI; no reason to lose it everywhere just to add personality at the top |
| Utility / tabular data | A monospace with tabular figures (e.g. IBM Plex Mono / JetBrains Mono), numerals only — never full sentences | Money, quantities, dates, IDs in table cells — tabular figures align digits column-wise, which measurably improves scan speed in exactly this kind of data-dense app and was previously unaddressed |

| Style | Face | Size / Weight | Usage |
|---|---|---|---|
| Display | Display face | 32 / 700 | Page H1 only |
| H1 (fallback, non-hero contexts) | Inter | 26 / 700 | Secondary page titles, modal titles |
| H2 | Inter | 22 / 700 | Section header |
| H3 | Inter | 18 / 600 | Card / panel title |
| Subtitle | Inter | 15 / 600 | Table group header, form section |
| Body 1 | Inter | 14 / 400 | Default UI text |
| Body 2 | Inter | 13 / 400 | Secondary/supporting text |
| Caption | Inter | 12 / 500 | Table column headers (uppercase), meta labels |
| Data (new) | Utility mono, tabular figures | 13–14 / 400–500 | Any numeric table column: price, quantity, date, invoice/reference number |

Minimum body size is still 13px; never below 12px even for captions (unchanged accessibility floor).

## 4. Spacing & radius

**Unchanged from the previous revision** — both scales retained exactly as-is per the "don't break token structure" constraint: **4, 8, 12, 16, 20, 24, 28, 32, 36, 40…** for spacing; `xs 2px / sm 4px / md 6px / lg 8px / round 500px` for radius. No new radius step introduced even though rounder icon strokes (§7) might tempt one — resist that; the existing `lg 8px` on cards/modals already reads well against a rounder icon language without needing to widen further.

## 5. Elevation

Unchanged: a 1px hairline border (`--theme-divider`) for resting cards/tables, a soft shadow only for floating surfaces (dropdowns, dialogs, toasts). New this revision: **elevation and motion are now coupled** for interactive surfaces — a floating element's shadow should animate in alongside its entrance transition (§11), not pop in instantly, but a resting element never gains a shadow just because it became interactive (e.g. a draggable Queue card gets a shadow only while actively being dragged, per §11's drag-and-drop pattern — not permanently, which would violate this section's "don't shadow resting content" rule).

## 6. Dark mode

Unchanged mechanism: toggle sets `data-theme="dark"` on `<html>`; status pill / KPI-delta text still needs the manual 700→300 step swap with widened tint opacity (`-16` → `-24`), via the same `pair(hue)` / `getStatusColors(hue, isDark)` pattern already established. Dark-mode neutral values refreshed per §2's table above (ink navy, not pure black).

## 7. Component inventory (source → dental use)

| Component | Bundle export / library | Dental clinic usage |
|---|---|---|
| Button (486 variants, collapsed to 1 in auto-extract) | — | **Hand-build** 4 variants (solid/outline/text/danger) + icon button from tokens — see the Buttons section of the style guide DC |
| TextField/Outlined, input-outlined | `InputOutlined` | All form fields |
| select-outlined, Form Select | `SelectOutlined`, `FormSelect` | Dropdowns (doctor, branch, treatment, payment method) |
| Checkbox / Radio / Switch / Slider | `Checkbox`, `Radio`, `Switch`, `Slider` | Consent checkboxes, gender radio, toggle settings |
| Cards, CardHeader | `Cards`, `CardHeader` | Dashboard KPI cards, summary panels |
| Chip | `Chip` | Payment method tags, filter chips, multi-select tags |
| Badge | `Badge`, `Badge3` | Notification counts, "new" markers |
| Avatar | `Avatar` | Patient/doctor/employee avatar |
| Alert | `Alert` | Inline success/warning/error banners |
| Snackbar / Toast | `Snackbar`, `Tost` | Toast confirmations |
| Tooltip | `Tooltip` | Icon-only button hints |
| Progress | `Progress` | Upload progress, stock level, payroll processing |
| Pagination | `Pagination` | All list/table pages |
| TableHead / TableCell | `TableHead`, `TableCell` | Data tables |
| ListItem, Menu/MenuItem | `ListItem`, `Menu`, `MenuItem` | Dropdown menus, notification list |
| BreadcrumbLink | `BreadcrumbLink` | Page breadcrumb |
| Horizontal/Vertical Stepper | `HorizontalStepper`, `VerticalStepper` | Multi-step forms; also now used for **status-as-steps** display (Financial Period closing, Stock Transfer lifecycle — see `finance.md` §5, `warehouse.md` §7) |
| TimelineItem / TimelineDot | `TimelineItem`, `TimelineDot` | EMR clinical timeline, audit trail, reservation history |
| Vertical Navbar Scroll | `VerticalNavbarScroll` | Sidebar shell reference |
| Footer | `Footer` | App shell footer |
| **Icon set (new)** | **Lucide** (`lucide-react`) | Replaces the previous unspecified/generic icon references throughout every page spec's row-action icons, sidebar icons, empty-state icons. Consistent 1.5–2px rounded stroke, optically balanced at 16/20/24px — see §7.1 |
| **Chart library (new, approved this revision)** | **Recharts** | The first approved charting library for this project — every prior page spec (`reservation.md` §5, `queue.md` §5, `finance.md` §10, `warehouse.md` §12) explicitly flagged "no library approved, renders as bar-lists/tables" as a gap; this revision closes it. See §11.4 |
| **Inline-edit cell (new)** | Hand-build on `TableCell` | Click-to-edit table cells — see §11.3 |
| **Draggable card / droppable column (new)** | Hand-build (no drag library approved yet — flag before adding one; native HTML5 drag-and-drop or a lightweight library like `@dnd-kit` are candidates, not yet decided) | Queue board columns, workflow-step boards — see §11.2 |
| **Odontogram chart (new, the signature element)** | Hand-build SVG, FDI-numbered arc | The product's one high-fidelity, high-interactivity screen — see §11.5 |

**Note on Button:** unchanged — hand-built markup in the style guide DC, not the bundle's baked-instance export.

### 7.1 Icon usage rules

- Stroke width 1.5px at 16/20px sizes, 2px at 24px+ — never mix stroke weights within one screen.
- Icons never carry meaning alone (pairs with §9's "never color-only status" rule) — an icon-only button always has a `Tooltip` (existing rule, now doubly true since Lucide's glyphs are less universally recognizable than a generic Material set for a few dental-specific actions like Quarantine Batch or Void Invoice — pair those with a visible text label, not just an icon, in the row-action, not just the tooltip).
- Row-action icon buttons: 20px icon, 32px hit target minimum (exceeds the 44×44 touch target only where the surrounding row itself gives adequate spacing — on tablet-sized touch surfaces, use the full 44×44, per `ui-guidelines.md` §7).

## 8. Status badge mapping (cross-module)

**Unchanged by this revision** — every table in §8–§8.4 (base cross-module mapping, plus the verified Reservation/Queue/Invoice/Visit lifecycle mappings added during the module-by-module design pass) references token **roles** (Primary/Success/Warning/Error/Info/Neutral), not literal hex values, so nothing here needs to change when the hex values underneath those roles change. Preserved verbatim below.

A single semantic mapping used everywhere a status pill appears — do not invent new colors per module:

| Domain status | Token pair |
|---|---|
| Reservation: Booked / Queue: Called | Info |
| Reservation: Confirmed / Queue: In Service | Primary |
| Reservation: Checked-in / Queue: Completed / Invoice: Paid | Success |
| Queue: Waiting / Invoice: Partial / Warehouse: Low stock | Warning |
| Reservation: Cancelled / Invoice: Unpaid / Billing: Void | Error |
| No-show / Skipped / Archived / Void | Neutral (`--theme-action-hover` bg, `--theme-text-secondary` fg) |

### 8.1 Reservation — full lifecycle (verified against shipped code)

The row above (from the first design pass) undercounted Reservation's real status set. `docs/03-sad/13-module-reservation.md` §6.1 defines 8 statuses (Draft, Confirmed, Checked In, In Queue, In Treatment, Completed, Cancelled, No Show); the shipped enum (`apps/frontend/features/reservation/types/reservation.types.ts`) uses its own naming — `BOOKED` instead of `Draft`, `CHECK_IN`/`IN_QUEUE`/`IN_SERVICE` instead of `Checked In`/`In Queue`/`In Treatment` — a reasonable renaming (not tracked as a gap needing a fix), but the **tone mapping** below is a real, intentional deviation from the SAD's own §33.5 "Color Standard" (which specifies Confirmed=Blue, Checked In=Green, In Queue=Orange, In Treatment=Purple, Completed=Gray, Cancelled=Red, No Show=Dark Red — a 7-hue palette this design system does not have, by design; see §2, only Primary/Secondary/Success/Warning/Error/Info exist). Rather than inventing Purple/Orange/Gray/Dark-Red tokens, the shipped implementation collapsed the lifecycle onto the existing 5 tones. This is the canonical mapping — extending, not contradicting, the row above:

| Status (shipped enum) | SAD §6.1 term | Token |
|---|---|---|
| `BOOKED` | Draft | Info |
| `CONFIRMED` | Confirmed | Info |
| `CHECK_IN` | Checked In | Warning |
| `IN_QUEUE` | In Queue | Warning |
| `IN_SERVICE` | In Treatment | Warning |
| `COMPLETED` | Completed | Success |
| `CANCELLED` | Cancelled | Error |
| `NO_SHOW` | No Show | Error |

`CANCELLED` and `NO_SHOW` share the Error tone and are distinguished only by their text label — consistent with §9's "every status pill carries a text label, never a bare dot" rule, but worth naming explicitly since it's the first case in this system where two distinct domain statuses share one token pair with no visual differentiation beyond text.

### 8.2 Queue — full lifecycle (verified against shipped code)

The original row above ("Queue: Called → Info", "Queue: In Service → Primary", "Queue: Waiting → Warning") does not match what shipped. `apps/frontend/features/queue/components/QueueListView.tsx`'s `QUEUE_STATUS_TONE` map is the real, current mapping — it also covers `SKIPPED`, which the module actually reintroduces into the active queue (Recall), unlike a true terminal "archived" state, so it does not fit this file's original "No-show / Skipped / Archived / Void → Neutral" grouping either. Superseding the original row for Queue specifically (Reservation's row is untouched and still correct — see §8.1):

| Status (`docs/03-sad/14-module-queue.md` §19) | Token |
|---|---|
| `WAITING` | Info |
| `CALLED` | Warning |
| `IN_SERVICE` | Warning |
| `COMPLETED` | Success |
| `CANCELLED` | Error |
| `NO_SHOW` | Error |
| `SKIPPED` | Neutral |

**Gap flagged — no badge actually renders this mapping.** `QUEUE_STATUS_TONE` is exported but only consumed to enumerate filter-dropdown options (`Object.keys(QUEUE_STATUS_TONE)`); no `Badge` in `QueueCard` or elsewhere in the Queue module renders it. The only status signal on a queue ticket is `QueueCard`'s `STATUS_ACCENT` — a 3px left-border color using raw CSS custom properties (`var(--color-warning-500)` etc., not routed through `Badge`) — plus, in board view only, the column header text. In the non-board (flat grid) view — reached by filtering to Cancelled/No-Show/Skipped — a card carries **no visible status text at all**, only its border color. This fails both `ui-guidelines.md` §3 ("status is always a colored pill, never a plain text cell") and this file's own §9 ("never color-only status communication — every status pill carries a text label"). Flagged as the top priority fix for this module: wire `QUEUE_STATUS_TONE` into an actual `Badge` on `QueueCard`, in addition to (not instead of) the left-border accent. **This revision's §11.2 drag-and-drop redesign of the Queue board is the natural moment to also fix this** — build the Badge in at the same time the card gets rebuilt for drag interaction, not as two separate passes.

### 8.3 Invoice — full lifecycle vs. what's shipped

`docs/03-sad/16-module-billing.md` §12 defines 7 invoice statuses (Draft, Pending Payment, Partially Paid, Paid, Closed, Cancelled, Void). The shipped enum (`apps/frontend/features/billing/components/InvoiceListView.tsx`, `INVOICE_STATUS_TONE`) only has 4 — `UNPAID`, `PARTIALLY_PAID`, `PAID`, `CLOSED` — and, importantly, **shipped `CLOSED` is not the same concept as SAD's `Void`**: SAD §12 defines Closed as "sudah dikirim ke Finance" (sent to Finance for reconciliation, a normal terminal state after Paid — confirmed by `InvoiceDetailView.tsx`'s `canClose = status === "PAID"`), while Void/Cancelled are separate abnormal-termination statuses with no shipped UI at all (see `billing.md` §2). The original cross-module row above ("Billing: Void → Error") describes a status that doesn't exist in the shipped app yet — kept in the table as forward-looking (for when Void ships), but do not treat it as already implemented. Current shipped mapping:

| Status (shipped enum) | SAD §12 term | Token |
|---|---|---|
| `UNPAID` | Pending Payment | Error |
| `PARTIALLY_PAID` | Partially Paid | Warning |
| `PAID` | Paid | Success |
| `CLOSED` | Closed (sent to Finance — not Void) | Neutral |

Draft, Cancelled, and Void have no shipped token mapping yet since they have no shipped UI — when Void/Cancel ships (see `billing.md` §2's flagged gap), it should use Error, consistent with the original cross-module row's intent, but distinguished from `UNPAID`/Pending-Payment by label text the same way Queue's `CANCELLED`/`NO_SHOW` are (§8.2).

### 8.4 Visit (EMR) — full lifecycle (verified against shipped code)

Not previously documented anywhere in this file. `apps/frontend/features/emr/components/VisitWorkspace.tsx`'s `VISIT_STATUS_TONE` map, added here for the same single-source-of-truth reason Reservation/Queue/Invoice were (§8.1–8.3) rather than left living only in `emr.md` §5:

| Status | Token |
|---|---|
| `DRAFT` | Neutral |
| `WAITING_EXAMINATION` | Info |
| `IN_PROGRESS` | Warning |
| `COMPLETED` | Success |
| `LOCKED` | Success |
| `ARCHIVED` | Neutral |

`COMPLETED`/`LOCKED` share Success and `DRAFT`/`ARCHIVED` share Neutral — both distinguished by label text only, consistent with the precedent set in §8.1–8.3.

## 9. Accessibility target

WCAG 2.1 AA — unchanged target, re-verified against the refreshed §2 hues: 4.5:1 minimum contrast for body text, 3:1 for large text/icons, visible focus ring using the Primary jade `500` step at 2px offset (was the previous teal `500` — same rule, refreshed value), and never color-only status communication — every status pill carries a text label, never a bare dot. **New this revision:** `prefers-reduced-motion` is now part of this section's binding floor, not just a §11 nicety — see §11.6.

## 10. What's still open

- No real product photography/branding assets exist yet (logo beyond the "PM" monogram placeholder, favicon, login illustration). Ask the user before inventing these.
- The Button hand-build should be lifted into a proper reusable component (React) during Claude Code implementation.
- **New this revision:** the drag-and-drop library for §11.2 is intentionally left undecided (candidates named, not chosen) — ask the user before adding a new dependency, per `docs/04-ai-contract/01-global-rules.md`'s "no new library without explicit approval." Recharts (§7, §11.4) *is* pre-approved by the user as part of this revision's own brief — do not re-ask for that one.
- The exact display and utility mono typefaces (§3) are named as examples of the right *category* (geometric sans with character; monospace with tabular figures) — final license/webfont selection is an implementation detail, not locked to the specific named faces if a comparable licensed alternative is preferred.

## 11. Motion & Interactivity Foundations

New section this revision. Detailed per-pattern UI rules (when to use inline edit vs. modal, drag-and-drop specifics, etc.) live in `ui-guidelines.md` §9 — this section defines the shared *tokens* those patterns draw from, the same way §2–§6 define the visual tokens components draw from.

### 11.1 Motion scale

Three durations only — resist adding a fourth without a specific, named reason:

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `motion-micro` | 100ms | ease-out | Hover/press states, focus ring appearance, checkbox/switch toggle |
| `motion-standard` | 180ms | ease-out (enter) / ease-in (exit) | Modal/panel open-close, tab switch, accordion expand, status-pill color transition |
| `motion-complex` | 280ms | ease-out (enter) / ease-in (exit) | Drag-and-drop settle, chart data transition, multi-step form transition |

Never animate layout-affecting properties (width/height/margin) for `motion-micro` — opacity/transform only, to stay smooth on lower-end clinic-desktop hardware.

### 11.2 Drag-and-drop

Applies to: Queue board (§8.2's cross-reference — Waiting→Called column movement), any future Kanban-shaped workflow board (Purchase Order or Stock Transfer status columns are plausible future candidates, not committed). Pattern: the dragged card gains the elevation shadow (§5) and a slight scale-up (1.02×) using `motion-complex`'s easing; the destination column gets a visible drop-zone highlight (a dashed border in Primary jade, not just a background tint, so it reads under color-blindness too); on drop, the card animates into its new position rather than snapping. **Every drag-and-drop interaction must have a non-drag equivalent** (e.g. the existing Call/Recall button actions already on `QueueCard`) — drag is an accelerator, never the only way to perform the action, both for accessibility and for touch/tablet clinic devices where drag can be unreliable.

### 11.3 Inline edit

Applies to: any list table where a modal is currently used for a single-field edit — Master Data catalogs' Active/Inactive toggle (already effectively inline via the Deactivate/Activate text link, per `master-data.md` §2 — extend the same principle to simple text/number fields), Chart of Accounts fields. Pattern: click (or a dedicated edit-icon on hover, per `ui-guidelines.md` §9.3) turns a `TableCell` into its corresponding input control in place; `Enter` or blur commits, `Escape` reverts; a save fails visibly in the cell itself (red outline + inline error, not a separate toast only) so the user doesn't lose context. **Not a replacement for the multi-field Create/Edit modal pattern already established across every module** (`master-data.md` §2, etc.) — inline edit is for single-field, low-risk corrections only; anything requiring validation across multiple fields, or anything destructive/irreversible, stays a modal or full page per `ui-guidelines.md` §4's existing modal-vs-full-page rule.

### 11.4 Interactive charts (Recharts, newly approved)

Closes the gap flagged repeatedly across last pass's Reservation/Queue Analytics, Finance/Warehouse Reports specs. Recharts components render using the §2 token roles directly (categorical series map to Primary/Info/Success/Warning/Secondary in that priority order, never an arbitrary hue outside the palette), respect the motion scale (§11.1 `motion-complex` for data transitions on filter change), and every chart retains a keyboard-accessible data table equivalent (a "View as table" toggle) — charts are additive, not a replacement for the underlying tabular data every report already provides. Tooltips on hover/focus, never click-only. This directly unblocks: `reservation.md` §5 and `queue.md` §5's bar-lists (upgrade to real charts), `finance.md` §10 and `warehouse.md` §12's report pages (add trend visualization where currently table-only).

### 11.5 Interactive odontogram — the signature element

The one place this system spends its aesthetic and interaction risk. Current state (per `emr.md` §3): a plain table + form, explicitly flagged by the code's own comments as a stand-in for the real interactive tooth chart described in `docs/03-sad/15-module-emr.md` §31. This revision commits to building that chart:

- An SVG FDI-numbered arc (32 permanent teeth, primary-dentition variant per SAD §14) rendered at a fixed aspect ratio, scaling within its container.
- Each tooth is independently clickable/keyboard-focusable (tab order follows FDI sequence); hover/focus shows a `motion-micro` highlight ring in Primary jade.
- Per-tooth condition color comes from Master Data's Tooth Condition catalog (`master-data.md` §4.1's existing `Color` hex field) — **not** a fixed design-system token, per the existing, correct reasoning in `emr.md` §6 (SAD §27 explicitly makes these colors clinic-configurable; forcing them into the Primary/Success/Warning/Error/Info palette would be wrong). This revision does not change that decision.
- Per SAD §27's own UI Rules (carried forward, still binding): color is never the only indicator — a small icon glyph and a tooltip/label always accompany the tooth's condition color, satisfying both this file's §9 and the odontogram's own source requirement independently.
- Selecting a tooth opens a side panel (not a modal — this is a "benefits from staying visible while browsing the chart" case per `ui-guidelines.md` §4) showing that tooth's condition history, using `motion-standard` for the panel's slide-in.
- Multi-tooth/surface selection (for recording a condition across several teeth at once, e.g. a full-arch scaling procedure) uses a drag-to-select or shift-click pattern — same non-mouse-only requirement as §11.2: a "select all," per-quadrant, and per-tooth-number-entry fallback must all reach the same result.

### 11.6 Reduced motion

`prefers-reduced-motion: reduce` disables all `motion-standard`/`motion-complex` transitions (collapse to instant, or opacity-only fades at ≤50ms if some transition is truly needed for state comprehension — e.g. a drag-drop's drop confirmation) — this is a hard accessibility floor (§9), not a nice-to-have. Concretely for §11.2–11.5: drag-and-drop drop animation becomes instant repositioning (drag *interaction* itself — the cursor tracking — is not "motion" in the animation sense and is unaffected); chart data transitions cut instead of tween; the odontogram's tooth highlight/panel-slide both collapse to instant appearance. Test every interactive pattern added under this section with the OS-level reduced-motion flag on before considering it complete — this is part of the Definition of Done (`overview.md` §4).

### 11.7 Micro-interactions (general)

Button press: `motion-micro` scale-down (0.98×) + no color change beyond existing hover state, so pressing reads as tactile without adding a new color token. Form save: the field/section that saved gets a brief `motion-micro` success-tone flash on its border (not the whole page), paired with the existing toast (`Snackbar`/`Tost`, §7) — the flash confirms *what* saved, the toast confirms *that* it saved. Status pill transitions (e.g. Queue ticket moving Waiting→Called) cross-fade between tones over `motion-standard`, never an instant color swap, so the eye can follow the state change on a busy board.
