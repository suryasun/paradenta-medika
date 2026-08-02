# Acceptance Criteria: Finance

> Source: `docs/03-sad/17-module-finance.md`, Section "Test Scenarios and Acceptance Criteria".

---

# 11. Test Scenarios and Acceptance Criteria

| ID | Scenario | Expected result |
|---|---|---|
| TC-FIN-001 | Post balanced manual journal | Posted journal has unique number and equal debit/credit |
| TC-FIN-002 | Post unbalanced journal | 422 `FIN_JOURNAL_UNBALANCED`; no header/details persist |
| TC-FIN-003 | Receive same payment event twice | Exactly one journal/cash movement exists |
| TC-FIN-004 | Billing payment with mapping missing | No journal; exception is traceable and replayable |
| TC-FIN-005 | Reverse posted journal | Original remains immutable; linked opposite journal posts |
| TC-FIN-006 | Edit posted journal | Denied; correction path is reversal only |
| TC-FIN-007 | Pay unapproved expense | Rejected; no cash movement |
| TC-FIN-008 | Expense self-approval | Rejected by segregation-of-duties policy |
| TC-FIN-009 | Cash transfer | One balanced journal and paired in/out movements |
| TC-FIN-010 | Zero-variance daily close | Can be approved and locks closing scope |
| TC-FIN-011 | Non-zero daily close without reason | Rejected with variance reason error |
| TC-FIN-012 | Duplicate daily close | Rejected by unique closing scope |
| TC-FIN-013 | Settle doctor fee twice | Second settlement rejects already-used source line |
| TC-FIN-014 | Post into closed period | 409 `FIN_PERIOD_CLOSED`; no ledger change |
| TC-FIN-015 | Reopen period by unauthorised role | 403; period remains closed |
| TC-FIN-016 | Cross-branch report request | Only authorised branch data returns |
| TC-FIN-017 | Concurrent payment events | No duplicate posting and trial balance remains balanced |
| TC-FIN-018 | Outbox consumer retry | Event arrives once logically; source journal remains single |

Acceptance criteria:

- Every posted journal balances to zero difference at two decimal precision.
- Financial source events are idempotent and traceable to a single journal reference.
- Posted data cannot be changed through UI, API, or routine job.
- Branch authorisation and period rules are enforced on every write and report.
- Daily closing and period close produce complete audit trails and reportable snapshots.

---

