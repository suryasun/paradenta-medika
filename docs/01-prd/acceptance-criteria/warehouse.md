# Acceptance Criteria: Warehouse

> Source: `docs/03-sad/18-module-warehouse.md`, Section "Test Scenarios and Acceptance Criteria".

---

# 11. Skenario Pengujian dan Acceptance Criteria

| ID | Skenario | Expected result |
|---|---|---|
| TC-WHS-001 | Create PO valid | PO draft memiliki nomor unik dan total benar |
| TC-WHS-002 | Receive PO belum approved | Ditolak; saldo tidak berubah |
| TC-WHS-003 | Partial goods receipt | Saldo bertambah dan PO menjadi partially received |
| TC-WHS-004 | Duplicate goods receipt post | Hanya satu transaksi PURCHASE dan satu perubahan saldo |
| TC-WHS-005 | Receipt expiry-tracked tanpa expiry | Ditolak dengan `WHS_BATCH_REQUIRED`/validasi expiry |
| TC-WHS-006 | EMR consume material cukup | Stock out, batch FEFO, dan event hasil dibuat atomik |
| TC-WHS-007 | EMR consume material kurang | Tidak ada saldo/ledger berubah dan failure event dapat ditelusuri |
| TC-WHS-008 | Duplicate EMR consumption event | Tidak ada out kedua |
| TC-WHS-009 | Consume batch expired | Ditolak; batch lain valid dapat dialokasikan |
| TC-WHS-010 | Transfer antar gudang | Pasangan transaksi source/destination seimbang quantity |
| TC-WHS-011 | Transfer ke gudang sama | Ditolak 422 |
| TC-WHS-012 | Adjustment tanpa approval | Tidak bisa post dan tidak mengubah saldo |
| TC-WHS-013 | Opname variance | Approval membuat satu transaksi OPNAME dengan reason |
| TC-WHS-014 | Opname diposting dua kali | Post kedua ditolak/idempoten |
| TC-WHS-015 | Concurrent stock issue | Saldo tidak negatif dan transaksi berlebih gagal |
| TC-WHS-016 | Low-stock threshold tercapai | Alert tunggal aktif dan notifikasi/event dikirim |
| TC-WHS-017 | Akses branch lain | API/report menolak atau hanya mengembalikan scope authorised |
| TC-WHS-018 | Finance consumer retry | Event sumber tetap mengarah pada satu business transaction |

Acceptance criteria:

- Semua perubahan saldo ditelusuri ke satu stock transaction immutable dan reference sumber.
- Stok tersedia tidak pernah negatif pada operasi normal.
- Batch/expiry, branch/warehouse scope, dan idempotency diterapkan pada semua mutasi.
- Receipt, issue, adjustment, transfer, dan opname bersifat atomik beserta update saldo dan outbox.
- Selisih stock opname, override, dan correction memiliki reason, approval, dan audit trail.

---

