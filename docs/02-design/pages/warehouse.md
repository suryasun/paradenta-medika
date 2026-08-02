# Pages: Warehouse Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/warehouse.md` (UC-WHS-001…007).

---

## Page Inventory

| Page | Purpose |
|---|---|
| Stock Balance | Saldo stok per gudang/item (current, reserved, available, minimum) |
| Stock Card | Kartu stok — riwayat in/out/saldo berjalan per item |
| Purchase Order List / Create PO | Buat & approve PO ke supplier |
| Goods Receipt | Terima barang dari PO approved, input batch/expiry |
| Stock Transfer | Transfer antar gudang/cabang |
| Stock Adjustment | Koreksi stok (rusak, hilang, expired, sample) dengan reason & approval |
| Stock Opname | Hitung fisik vs sistem, approval variance |
| Expiry / Low Stock Alerts | Daftar item mendekati/lewat expired dan di bawah minimum stock |

## Purchase Order Detail Sections

```text
Purchase Order
├── Supplier & Branch & Warehouse
├── Line Items (item, qty ordered, unit price, expected date)
├── Status: Draft → Submitted → Approved → Partially Received → Received / Cancelled
└── Actions: Submit · Approve/Reject · Receive Goods
```

## Stock Opname Sections

```text
Stock Opname
├── Warehouse & Date (opens a system-balance snapshot)
├── Count sheet (item, system qty, physical count, variance, note)
├── Variance review (approver can correct before approval)
└── Approval → generates one OPNAME adjustment transaction (posted, immutable)
```

FEFO batch selection (business-rules.md / warehouse §3.6) should surface in the Goods Issue/Consumption UI as a read-only "suggested batch" the user can only override with a visible reason field.
