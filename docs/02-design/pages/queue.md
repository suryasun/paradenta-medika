# Pages: Queue Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/queue.md` and `docs/01-prd/business-rules.md` §4 (Rules 1–10). No dedicated UI Pages section exists in the SAD for this module.

---

## Page Inventory

| Page | Purpose |
|---|---|
| Queue Dashboard (Board) | Kanban per status: Waiting / Called / In Service / Completed — see `Parakita - Key Screens.dc.html` |
| Queue Detail | Satu tiket antrean: pasien, dokter, waktu tunggu, waktu layanan |
| Queue History | Riwayat antrean per tanggal/cabang |

## Queue Board Sections

```text
Queue Dashboard
├── Branch / Date filter
├── Column: Waiting (queue number, patient, doctor, wait duration)
├── Column: Called
├── Column: In Service
├── Column: Completed
└── Actions per ticket: Call · Recall · Skip · Complete · Cancel
```

## Business-rule-driven UI constraints

- One active queue per patient per branch per day (Rule 1) — Check-in UI must block a second ticket for the same patient/day.
- `IN_SERVICE` only reachable after `CALLED` (Rule 9) — the board must not allow drag/skip directly from Waiting to In Service.
- Completed tickets cannot return to Waiting (Rule 5) — no "reopen" action on completed cards.
- Billing can only be created once a queue is `COMPLETED` (Rule 10) — the patient's invoice action should be disabled/hidden until then.
