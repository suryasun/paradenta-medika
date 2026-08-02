# Acceptance Criteria: Billing

> Source: `docs/03-sad/16-module-billing.md`, Part 10 — Test Scenario & Acceptance Criteria (User Acceptance Criteria and Exit Criteria sections, plus Test Coverage Summary).

---

# 15. User Acceptance Criteria

Billing Module dinyatakan diterima apabila:

- Seluruh Invoice berhasil dibuat dari EMR Completed.
- Payment mendukung Full, Partial, Multiple, dan Split Payment.
- Discount, Insurance, dan Deposit dihitung dengan benar.
- Refund mengikuti approval dan business rule.
- Invoice Paid tidak dapat diubah.
- Invoice Closed tidak dapat dimodifikasi.
- Audit Trail tercatat untuk seluruh transaksi.
- Event dikirim ke Finance dan Reporting sesuai proses bisnis.

---

# 16. Exit Criteria

Pengujian Billing Module dinyatakan selesai apabila:

- Seluruh Functional Test lulus.
- Seluruh Integration Test lulus.
- Tidak terdapat Critical Defect.
- Tidak terdapat High Severity Defect yang memengaruhi transaksi finansial.
- Seluruh Acceptance Criteria terpenuhi.
- Product Owner memberikan persetujuan implementasi.

---

# Test Coverage Summary

| Area | Coverage |
|------|:--------:|
| Invoice | ✔ |
| Payment | ✔ |
| Discount | ✔ |
| Insurance | ✔ |
| Deposit | ✔ |
| Refund | ✔ |
| Void | ✔ |
| Security | ✔ |
| Integration | ✔ |
| Performance | ✔ |

