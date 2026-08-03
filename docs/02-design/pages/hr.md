# Pages: Human Resource Module

> Status: **Proposed Design — no backend or frontend exists yet.** Unlike every other module in this pass, HR has **zero implementation**: no `apps/backend/src/modules/hr` directory exists at all (confirmed by directory listing), and it appears in no Phase 1–3 task list — it's referenced only as a future data source for Reporting's (also-unbuilt) HR dashboard concept, which itself turned out not to have a real backend route either (`reporting.md` §1's gap note: only 5 dashboards exist, no HR one). This spec is therefore the least-grounded of this whole pass — pure `docs/03-sad/19-module-hr.md` + `docs/01-prd/business-rules.md` §8 derivation, re-verified against those sources' actual content (not just the pre-verification draft's summary of them) rather than any running code.

---

## 1. Page Inventory

| Page | Purpose | SAD source |
|---|---|---|
| Employee List | All employees — filter branch/department/status | §3.3 Employee entity |
| Employee Detail | Profile, contract, salary history, documents (privacy-gated, see §5) | §3.3 |
| Schedule & Attendance | Work schedule + check-in/out + correction | §3.3 Schedule/Attendance |
| Leave Request | Submit & approve leave | §3.3, §3.6 state machine |
| Overtime Request | Submit & approve overtime | §3.3, §3.6 state machine |
| Payroll Run | Calculate → Review → Approve → Lock payroll per period | §3.6, §4.6 UC-HR-005 |
| Payslip | Self-service payslip view (restricted) | §4.1 Actor Matrix "own payslip" |
| Employee Termination | Terminate with effective date (UC-HR-007) | §4.8 |

This matches the pre-verification draft's page list closely — it held up well against the real SAD text, unlike several other modules' drafts this pass. The corrections below are about internal accuracy (status names, state machine, actor matrix), not page-level structure.

---

## 2. Employee status (SAD §3.3) — correcting an implied assumption

Employee status: `draft`, `active`, `suspended`, `terminated`, `inactive` (5 values) — not previously documented anywhere in `docs/02-design`. Using existing tokens: `active`→Success, `draft`→Neutral, `suspended`→Warning, `terminated`/`inactive`→Neutral (both are past-tense/archived-adjacent, sharing a tone the same way Queue's `CANCELLED`/`NO_SHOW` and Billing's future Void/Cancelled would — distinguished by label only, consistent with the pattern this design system now uses repeatedly rather than inventing a 5th tone). Termination does not delete history/user/payroll/audit records (§3.3) — Employee Detail should keep a terminated employee's tabs readable, not hide them, mirroring Master Data's Deactivate-not-delete convention throughout this codebase.

## 3. Payroll Run — corrected state machine (SAD §3.6)

The pre-verification draft's Payroll Run section (Period/Branch selector → snapshot → exceptions → Review→Approve→Lock) is directionally right but the actual state machine is more specific and should drive the page's status display directly:

```text
Draft --(calculate)--> Calculated --(review)--> Reviewed
Reviewed --(approve)--> Approved --(publish event)--> SentToFinance --(finance ack)--> Locked
Reviewed --(revise)--> Draft
Approved --(approved correction)--> Reversed
Draft --(cancel)--> Cancelled
```

`SentToFinance` as its own distinct status (not just "Approved" going straight to a generic "sent") means the Payroll Run detail page needs a visible "awaiting Finance acknowledgement" state between Approve and Locked — the pre-verification draft's "Integration status (sent to Finance — read-only from HR side)" note was right to flag this as its own concept, and the real state machine confirms it deserves its own status pill, not just a footnote. Business rule #8 (§3.5: "Payroll approved/locked tidak dapat diubah atau dihapus. Koreksi menghasilkan adjustment/reversal") means once Approved, the UI must not offer an Edit action at all — only a new Reversed-generating correction flow, structurally separate from editing (same "correction, not mutation" principle Finance's Journal Reverse already establishes, `finance.md` §4).

Leave/Overtime share a simpler, separate state machine (§3.6): `Draft → Submitted → Approved | Rejected`, `Approved → Cancelled` (before cutoff only, per business rule #4: "cancellation mengembalikan kuota hanya bila payroll terkait belum locked" — Cancel should be disabled once the relevant payroll has locked, not just rejected server-side).

## 4. Core business rules → concrete UI constraints (SAD §3.5)

| Rule (paraphrased) | UI implication |
|---|---|
| No overlapping schedules for one employee | Schedule create/edit form should check overlap client-side before submit, same live-validation principle as Warehouse's `WHS_SOURCE_DESTINATION_SAME` (`warehouse.md` §2) |
| Check-out before check-in, duplicate attendance, future-dated attendance all rejected (unless authorized import) | Attendance correction form needs explicit min/max time bounds and a duplicate-scope check, not just server rejection |
| Leave quota changes on approval; cancellation only restores quota if payroll not yet locked | Cancel button on an Approved leave should be disabled-with-tooltip once the relevant payroll run is Locked (mirrors §3's Reversed-not-Edit principle) |
| Overtime must be approved before entering payroll, linked to exactly one payroll item | Payroll Run's eligible-employee snapshot (pre-verification draft's own term, still apt) should visibly show which overtime entries are/aren't approved-and-linkable |
| One employee-period cannot appear in more than one *final* payroll run per branch/payroll-type scope; reruns are draft/adjustment, never a duplicate final | Payroll Run creation should warn/block re-running a period that already has a Locked run for the same employee scope, offering "create adjustment" instead |
| Employee bank account never sent via the Payroll event — only a safe identifier/token | Not a page-layout concern directly, but means Payslip/Payroll Run detail should never round-trip and re-display a raw bank account number fetched from an event payload — only from Employee's own record, and only where §5's privacy gate allows |

## 5. Privacy (SAD Actor Matrix §4.1 + business rule #9)

The pre-verification draft's privacy note holds up and is now better-sourced: SAD §4.1's Actor Matrix shows "Manage salary/bank data" as HR Staff=limited, HR Manager=full, Employee=self-limited, Finance=read payout ref only, Owner=blank (not even listed) — i.e. **even Owner does not have blanket salary/bank visibility** in the source Actor Matrix, which is stricter than the pre-verification draft implied. Employee Detail's salary/bank/document tabs must gate per this real matrix, not a generic "Administrator sees everything" assumption — show "Restricted — insufficient permission" rather than hiding the tab (draft's own recommendation, now confirmed consistent with the real Actor Matrix's granularity).

## 6. RBAC (SAD §4.1 Actor Matrix, verbatim roles — not inferred, unlike Finance/Warehouse)

| Use case | HR Staff | HR Manager | Employee | Supervisor | Finance | Owner | Administrator |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View self profile/schedule | | | ✔ | | | | ✔ |
| Manage employee/contract | ✔ | ✔ | | | | | ✔ |
| Manage salary/bank data | limited | ✔ | self limited | | read payout ref | | ✔ |
| Create schedule/attendance correction | ✔ | ✔ | self request | ✔ | | | ✔ |
| Submit leave/overtime | ✔ | ✔ | ✔ | ✔ | | | ✔ |
| Approve leave/overtime | | ✔ | | ✔ (scope) | | | ✔ |
| Calculate payroll | ✔ | ✔ | | | | | ✔ |
| Approve/lock payroll | | ✔ | | | | ✔ | ✔ |
| View/export payroll | limited | ✔ | own payslip | | controlled | ✔ | ✔ |

This is the one RBAC table in this whole pass sourced verbatim from a real SAD Actor Matrix rather than inferred from a permission-string catalog — worth noting the difference in confidence level explicitly. Supervisor's "scope" qualifier on Approve leave/overtime implies org-hierarchy-scoped approval (a Supervisor approves their own reports' requests, not everyone's) — a materially different access-scoping mechanism than the flat role-based `PermissionGuard` pattern every other module in this codebase uses, and worth flagging as a design question before implementation: does this need a manager-hierarchy data model, not just a permission string?

---

## 7. Navigation

No sidebar entry exists (no frontend at all). When built, should sit alongside Finance/Warehouse in the sidebar's proposed nested-section pattern. `navigation.md` §4's existing HR tree (`Employee List / Schedule & Attendance / Leave & Overtime / Payroll Run / Payroll Register (Reports)`) is reasonable and not corrected in this pass beyond noting it remains fully proposed — HR has no code at all to verify structure against, unlike the SAD-content corrections made to §2–§6 above.

## 8. Interactivity (2026 refresh — `design-system.md` §11, `ui-guidelines.md` §9)

Lightest-touch of any module in this revision, consistent with HR's status as the only fully-unbuilt module in this project (see this file's own status banner) — speculating detailed interaction design on top of already-speculative page structure compounds risk. What's clearly warranted regardless of implementation detail: **live update** on Payroll Run's status (§3's state machine — Draft→Calculated→Reviewed→Approved→SentToFinance→Locked) should visibly progress without a refresh as each stage completes, especially the SentToFinance→Locked transition which depends on an external acknowledgement (§3) the HR user is otherwise just waiting on. **Micro-interactions**: Leave/Overtime Approve/Reject (§6's Actor Matrix) get the same border-flash confirm pattern as every other approval action in this system (`design-system.md` §11.7). Inline edit, drag-and-drop, interactive charts, and the odontogram are all either not-yet-applicable (no page layout confident enough to attach them to) or not relevant to this module's subject matter — not forced in for completeness.
