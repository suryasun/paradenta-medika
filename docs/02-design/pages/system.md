# Pages: System Administration Module

> Status: **Verified against shipped code** (Phase 1, task-015–026's System half). `docs/01-prd/features/system.md` (UC-SYS-001–007) covers the full module concept; only User and Role administration have shipped a frontend. Menu Management, System Parameter, Feature Flag, Notification Template, Audit/Activity Log, and Background Job Monitor are all backend-only so far (Audit Dashboard/Notification Center/Approval Workflow/Background Jobs were built as Phase 3 backend epics this session and in prior sessions — no frontend yet for any of them).

---

## 1. Page Inventory

| Page | Route | Purpose |
|---|---|---|
| User List | `/system/users` | Search users, link to Detail |
| Create User | `/system/users/new` | New user + initial role assignment |
| User Detail | `/system/users/{id}` | Activate/Deactivate, Revoke Sessions, edit Email, assign Roles |
| Role List | `/system/roles` | List roles, open Permissions modal per role |

**Gap flagged against the pre-verification draft:** 6 of its 8 assumed pages (Menu Management, System Parameter, Feature Flag, Notification Template, Audit/Activity Log, Background Job Monitor) have no shipped frontend. This tracks the same Phase 1-only-vs-later-phases pattern as Billing — these six correspond to backend work from later epics (Phase 3's Epic AI/AJ/AK/AL) that hasn't had its frontend pass yet. Not silently assumed built.

---

## 2. User List (`/system/users`)

```text
Users
├── Header: H1 "Users" + PermissionGuard(system.user.manage) → "New User" (links to /system/users/new)
├── Search input (username/email)
├── LoadingState | ErrorState | EmptyState | Table
└── Pagination
```

Columns: Username, Email, Status (Badge: `ACTIVE`→success, else neutral — a 2-state simplification; no distinct Suspended/Locked tone even if the backend models more than 2 statuses, unconfirmed either way in this pass), Last Login, Actions (single "Manage" link → Detail).

States: `LoadingState` spinner (cross-cutting gap), `EmptyState title="No users found"` (no description/action — gap, consistent pattern), `ErrorState` + retry (compliant). Table behavior: search ✔, filter/sort ✖ (gap, consistent pattern), pagination ✔.

---

## 3. Create User (`/system/users/new`)

Single-page form (`ui-guidelines.md` §2 correctly not using a stepper — 4 fields): Username, Email, Password, Roles (checkbox list). Submit-gated only by native `required`, no blur validation (consistent pattern). Password has no visible strength/confirmation requirement — worth flagging given this creates a login credential directly (unlike every other form covered so far, this one has real account-security stakes); not asserted as insufficient, just noted as unverified against `docs/04-ai-contract/09-security-contract.md`'s password policy in this pass.

---

## 4. User Detail (`/system/users/{id}`)

```text
User Detail
├── Header: username (H1) + status Badge
├── Action bar: PermissionGuard(system.user.activate) → "Activate" (if not
│   ACTIVE) · PermissionGuard(system.user.deactivate) → "Deactivate" (danger,
│   if ACTIVE) · PermissionGuard(system.user.session.revoke) → "Revoke All
│   Sessions" (secondary, always shown while guard passes)
├── PermissionGuard(system.user.manage) → Email edit (Input + "Save Email")
└── PermissionGuard(system.user.role.manage) → Assign Roles (checkbox list + "Save Roles", disabled until ≥1 selected)
```

**Significant functional gap flagged — role checkboxes do not pre-populate from the user's current roles.** `roleIds` initializes as `useState<string[]>([])`, with no effect syncing it to `user`'s existing role assignments once loaded. Opening any user's Detail page shows every role checkbox unchecked regardless of that user's actual current roles — an administrator has no way to see what roles a user already has from this UI, and clicking "Save Roles" would submit only whatever was freshly checked in this session, not an additive/accurate update. This is the same class of bug as §5's Role Permissions modal below — **the same fix (initialize state from the loaded entity, add a sync effect) applies to both**, suggesting a shared root cause worth fixing once rather than twice.

No Deactivate confirm-modal despite it being a real account-access action — `ui-guidelines.md` §2 doesn't explicitly list account deactivation in its destructive-action example set (Void/Refund/Delete/Terminate/Reopen), but it's arguably in the same class; flagged as a judgment call for the user to confirm rather than silently assumed fine or silently "fixed."

---

## 5. Role List (`/system/roles`) + Permissions Modal

```text
Roles
├── Header: H1 "Roles" + PermissionGuard(system.role.manage) → "New Role" → CreateRoleModal
├── LoadingState | ErrorState | EmptyState | Table
│   Columns: Code, Name, Description, Type (Badge: System=info, Custom=neutral), Actions
└── "Permissions" link (PermissionGuard(system.role.permission.manage)) per row → RolePermissionsModal
```

`Type` Badge correctly distinguishes system-locked roles from custom ones (SAD/business-rules.md's "system roles locked from deletion" rule, per the pre-verification draft's own citation) — though no Delete action exists on custom roles either, so that lock has nothing to visibly demonstrate against; can't confirm from the frontend alone whether Delete is simply not-yet-built for custom roles or intentionally absent.

**Same functional gap as §4:** `RolePermissionsModal`'s `selected` state initializes as `useState<string[]>([])`, never synced from the role's actual current permission grants. Opening "Permissions" for any role — including one with many existing grants — shows every checkbox in the grouped-by-module list unchecked. This is the higher-stakes instance of the two (RBAC permission grants, not just role labels), and should be the priority fix of the two.

Permission list groups by `permission.module` (dynamic sections, not a fixed set) — a reasonable, extensible layout matching how Master Data's catalog list handles variable-length content, but note it means this screen's structure is entirely data-driven from whatever `permission.module` values exist server-side; no design-system.md component change needed, just documenting the pattern.

---

## 6. RBAC

Permission strings observed in shipped code: `system.user.read` (sidebar + list), `system.user.manage` (create, email edit), `system.user.activate`, `system.user.deactivate`, `system.user.session.revoke`, `system.user.role.manage`, `system.role.read` (sidebar + list), `system.role.manage` (create role), `system.role.permission.manage` (open Permissions modal). No SAD/PRD permission-matrix table was cross-checked against these in this pass (System's own module doc wasn't read in full given this session's scope) — flagged as an open verification item for whoever does the next System pass, rather than fabricating a role matrix that wasn't sourced.

Sidebar (confirmed, `apps/frontend/config/navigation.ts`): "System" section, 2 children — Users (`system.user.read`), Roles (`system.role.read`).

---

## 7. Navigation

**Entry points:** Sidebar "System" → Users / Roles (2 sub-items, confirmed structure). **Exit points:** User Detail's role checkboxes reference Role List's data (`useRoles()`) but there's no link from User Detail *to* Role List's "Permissions" view for a given role the user has — an admin investigating "why can't this user do X" must navigate to Roles separately and find the same role again.

`navigation.md` §4's existing System tree (`User Administration / Role & Permission / Menu & Feature Flag / System Parameter / Notification Template / Audit / Activity Log`) should be marked confirmed only for the first 2 items — the remaining 4 have no shipped UI (see §1). Done as part of this pass (see the corresponding edit).

## 8. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

**This is the one module where an interactivity pass and a bug fix are the same piece of work.** §4/§5's flagged pre-population bug (Role-Permissions and User-Role checkboxes both open blank regardless of actual current grants) should be fixed *as* an inline-edit-shaped rebuild, not patched separately: initialize `selected`/`roleIds` from the loaded entity, then treat each checkbox toggle as an optimistic inline edit with a `motion-micro` confirm flash on save rather than the current plain "Save Roles"/"Save Permissions" button with no per-item feedback. This turns two currently-broken, currently-static forms into the module's actual interactivity showcase for free. Micro-interactions: Activate/Deactivate on User Detail (§4) gets the same success/neutral border-flash pattern as Master Data's Deactivate (`master-data.md` §9). Not applicable: drag-and-drop, live update, interactive charts, odontogram — none of this module's two shipped screens have a natural fit for them.

---

## 9. Multi Branch Platform Addendum (Phase 4, task-210/211/215/217 — `docs/06-tasks/phase-4-documentation/`)

### 9.1 User Detail — Branch Assignments

```text
User Detail
└── Branch Assignments (new section, below the existing Roles block)
    ├── LoadingState | ErrorState | Table (Branch, Default, Effective From)
    ├── Multi-select branch list (checkbox per branch) + one radio/star per
    │   selected row for "Default" (exactly one required before Save)
    └── PermissionGuard(system.user.branch.manage) → "Save Assignments"
        → replaces the user's full branch-assignment set (POST
        /system/users/{userId}/branches is a replace, not additive —
        docs/03-sad/21-module-system.md §21 task-210's own AC)
```

Pre-populates from `GET /system/users/{userId}/branches` using the exact "adjust state during render" sync idiom already fixed for §4/§5's roleIds bug (`UserDetailView.tsx`'s own established pattern) — this section must not reintroduce a blank-checkbox flash on first paint. Inline error (`SYS_BRANCH_SCOPE_INVALID` / `SYS_SELF_ESCALATION_FORBIDDEN`) rendered the same way as the existing role-assignment error, directly under the Save control.

### 9.2 Role List — Cross-Branch Toggle

```text
Roles
└── Table, new "Cross-Branch" column (after Type)
    └── Toggle, PermissionGuard(system.role.branch-policy.manage)
        disabled (not hidden, ui-guidelines.md §5) + tooltip "Built-in
        roles cannot change branch scope" when role.isSystem
```

Calls `PATCH /system/roles/{roleId}/branch-policy`. A built-in role (Administrator etc.) rejects this with `SYS_ROLE_SYSTEM_PROTECTED` server-side — the disabled state on `isSystem` rows exists precisely so the UI doesn't invite a request the server will always reject, per `ui-guidelines.md` §5's "visible-but-disabled when the user needs to understand a workflow exists but isn't theirs."

### 9.3 Role-Branch Matrix (`/system/roles/branch-matrix`, new page)

```text
Role-Branch Matrix
├── Header: H1 "Role-Branch Matrix"
├── LoadingState | ErrorState | EmptyState | Table
│   Columns: Role, Branch, User Count
└── (read-only — no actions; a user contributes one row per concurrent
    role+branch combination they hold, task-215's own AC)
```

Gated `system.role.read`. No existing checkbox-grid/matrix component fits a count-per-cell table, so this is a plain `Table` — not a new primitive.

### 9.4 Interactivity

Branch Assignments (§9.1) follows the same inline-edit/state-sync discipline as §8's fix. The Cross-Branch toggle (§9.2) is a single-field boolean flip — a natural `motion-micro` toggle-switch component, not a modal. Role-Branch Matrix (§9.3) is read-heavy with no natural chart fit (counts in a grid, not a trend) — not applicable.
