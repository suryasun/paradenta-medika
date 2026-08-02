# Pages: Finance Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/finance.md` (UC-FIN-001…007) and its Actor Matrix. Finance is accounting-of-record; keep its UI clearly separated from Billing's patient-facing invoice UI.

---

## Page Inventory

| Page | Purpose |
|---|---|
| General Ledger / Journal List | Lihat & cari jurnal terposting |
| Manual Journal (Create/Post) | Jurnal manual untuk penyesuaian — draft oleh Finance Staff, post oleh Finance Manager |
| Cash & Bank Accounts | Saldo kas/bank per cabang/kasir |
| Cash Transfer | Transfer antar akun kas/bank |
| Daily Cash Closing | Tutup kas harian per kasir/shift, dengan varians |
| Expense List / Create Expense | Pengajuan, approval, pembayaran biaya operasional |
| Doctor Fee Settlement | Kalkulasi & pembayaran jasa dokter |
| Financial Period | Buka/kunci/tutup/buka-kembali periode akuntansi |
| Financial Reports | Trial balance, general ledger, income statement, cash flow, expense, closing, payroll summary |

## Daily Cash Closing Sections (per UC-FIN-005)

```text
Daily Cash Closing
├── Branch / Cashier / Shift / Date selector
├── Expected balance (system-calculated)
├── Counted cash input (denomination breakdown)
├── Variance (auto-calculated; reason required if non-zero)
└── Actions: Submit → Approve (Finance Staff if zero variance; Finance Manager if variance)
```

## Role-gated actions (from Actor Matrix, features/finance.md §4.1)

Post/reverse journal, approve expense, approve closing variance, and close/reopen period are Finance Manager / Owner actions — the UI must show these as visible-but-disabled (not hidden) to Finance Staff/Cashier so the workflow stays legible, per `ui-guidelines.md` §5.
