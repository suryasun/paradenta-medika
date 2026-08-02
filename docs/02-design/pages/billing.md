# Pages: Billing Module

> Status: **Proposed Design** — derived from `docs/01-prd/features/billing.md` and `docs/01-prd/business-rules.md` §5.

---

## Page Inventory

| Page | Purpose |
|---|---|
| Invoice List | Seluruh invoice — filter status, cabang, kasir, tanggal |
| Generate Invoice | Invoice otomatis dari EMR completed / manual invoice |
| Invoice Detail | Rincian tindakan, obat, diskon, pajak, total |
| Payment | Proses pembayaran (tunai, kartu, QRIS, transfer, e-wallet, deposit, mixed) |
| Refund | Full/partial/deposit refund dengan approval |
| Void / Cancel Invoice | Pembatalan invoice dengan alasan wajib |

## Invoice Detail Sections

```text
Invoice Detail
├── Patient & Visit Summary
├── Line Items (treatment, medicine — qty, price, discount source)
├── Discount (Doctor / Manual / Promotion / Membership)
├── Insurance / Company Guarantee (if applicable)
├── Tax & Total
├── Payment History (multi-payment support)
└── Actions: Print · Reprint · Void · Refund · Re-open (per business-rules.md §5)
```

## List Actions

| Action | Description |
|---|---|
| View | Lihat rincian invoice |
| Receive Payment | Cash / Debit / Credit / QRIS / Transfer / E-wallet / Deposit / Mixed |
| Void | Invoice belum dibayar — tidak bisa diubah setelah dibayar, hanya Void/Refund |
| Refund | Wajib alasan + approval sesuai nominal |
| Print / Reprint | Cetak invoice/kwitansi |

Status pill: Unpaid=Error, Partial=Warning, Paid=Success, Void=Neutral (design-system.md §8).
