# Feature: Reporting & Dashboard

> Source: derived from `docs/03-sad/20-module-report.md`. Scope and use cases below are extracted directly from that document; no capability is added beyond what it specifies.

---

## Scope

# 1. Pendahuluan dan Ruang Lingkup

## 1.1 Overview

Reporting & Dashboard adalah modul read-only yang mengubah data operasional tervalidasi menjadi dashboard, laporan, snapshot, dan export bagi pengguna klinik serta manajemen. Modul ini mengonsumsi event dari domain sumber atau read projection yang disetujui; Reporting tidak membuat atau mengubah patient, reservation, EMR, invoice, journal, stock, employee, maupun transaksi domain lain.

Entity inti mengikuti ERD Parakita: `report_jobs`, `report_snapshots`, dan `dashboard_summaries`. Modul ini berfungsi sebagai presentation/read-model layer agar query analitik tidak membebani jalur transaksi operasional.

## 1.2 Tujuan

- Menyediakan informasi operasional dan manajemen yang cepat, konsisten, dapat difilter, dan dapat ditelusuri.
- Memisahkan beban baca/analitik dari database transaksi domain.
- Menyajikan definisi KPI dan batas data yang eksplisit, terutama untuk pendapatan dan keuangan.
- Mendukung multi-branch, role-based visibility, export aman, dan audit akses.
- Menjaga snapshot dan metadata agar hasil laporan dapat direproduksi.

## 1.3 In Scope

| Area | Cakupan |
|---|---|
| Dashboard | Executive, operational, clinical, billing, finance, warehouse, dan HR KPI |
| Reports | Operational, clinical aggregate, billing, financial, inventory, HR, audit/activity |
| Report execution | Synchronous query ringan, asynchronous report job, snapshot, export |
| Data delivery | Event projection, refresh schedule, data-as-of, backfill/replay |
| Governance | Metric catalog, filter validation, row-level branch access, export audit |
| Analytics | Trend, comparison, aggregation, drill-down sesuai permission |

## 1.4 Out of Scope

- Membuat/memperbarui transaksi sumber atau menjalankan command ke modul lain.
- Menjadi pengganti buku besar Finance, detail invoice Billing, rekam medis EMR, atau ledger stok Warehouse.
- Menetapkan diagnosis/clinical decision, accounting posting, approval, dan workflow operasional.
- Business intelligence warehouse enterprise, predictive model, natural-language analytics, external BI connector, atau data lake; roadmap.

## 1.5 Prinsip Desain

1. **Read-only by architecture.** Tidak ada endpoint/report job yang memutasi aggregate sumber.
2. **Source-of-truth awareness.** Laporan menyebut modul/record state yang menjadi basisnya.
3. **As-of transparency.** Semua hasil menyertakan `dataAsOf`, refresh state, filter, timezone, dan definition version.
4. **Eventual consistency disclosed.** Dashboard near-real-time dapat tertinggal dari transaksi; lag ditampilkan dan dipantau.
5. **Financial safety.** Financial statement hanya memakai journal posted/period state dari Finance, bukan kalkulasi ulang dari invoice mentah.
6. **Privacy and least privilege.** Data pasien dan karyawan dipseudonimkan/dibatasi bila detail tidak diperlukan.
7. **Reproducible output.** Snapshot menyimpan parameter, schema/metric version, source watermark, dan checksum.
8. **Export is sensitive.** Export mengikuti permission, batas data, watermark, expiration, dan audit.

---


---

## Use Cases / Functional Flow

# 4. Katalog Dashboard dan Laporan

## 4.1 Actor Matrix

| Consumer | Primary dashboard/report | Detail access |
|---|---|---|
| Owner | Executive KPI, financial, growth, branch comparison | Cross-branch per permission |
| Clinic Manager | Operational, queue, clinical throughput, attendance | Assigned branch/clinic |
| Finance | Financial statement, cash, expense, closing, payroll summary | Finance scope |
| Cashier | Daily billing/payment/closing | Own branch/shift scope |
| Doctor | Own schedule, workload/productivity aggregate | Own/assigned scope; no unauthorised PII |
| Warehouse Staff | Stock, movement, expiry, procurement | Assigned warehouse/branch |
| HR Staff | Headcount, attendance, leave, payroll | HR scope; payroll restricted |
| Administrator | System/audit/report-job monitoring | Administrative scope |

## 4.2 Executive Dashboard

| KPI | Definition/source | Refresh |
|---|---|---|
| Visits | EMR final valid visits | Near-real-time |
| Patient growth | New active patients | Daily/near-real-time |
| Collection | Billing successful payments | Near-real-time |
| Accounting revenue | Finance posted revenue | Near-real-time or scheduled |
| Net result | Finance posted revenue less expense | Period/as-of based |
| Outstanding | Billing outstanding invoice balance | Near-real-time |
| Queue service level | Queue/EMR wait/service metrics | Near-real-time |
| Low stock items | Warehouse active alerts | Near-real-time |
| Payroll cost | HR approved/locked payroll | Per payroll period |

Executive dashboard is aggregate-first. Drill-down ke patient, employee, or journal detail mengikuti permission asal; Owner dashboard access tidak otomatis memberi akses ke semua restricted detail.

## 4.3 Operational Reports

| Report | Source | Filter utama | Output |
|---|---|---|---|
| Patient registration | Patient | Branch, date, demographic non-sensitive | Count/list per access |
| Reservation & no-show | Reservation | Branch, service, doctor, date | Booking/status/no-show rate |
| Queue performance | Queue/EMR | Branch, room, provider, date | Wait, service, throughput |
| Visit/treatment | EMR | Branch, doctor, service, date | Visit count and treatment aggregate |
| Billing daily | Billing | Branch, cashier, date, payment method | Invoice/payment/refund totals |
| Activity/audit | System | Actor, action, module, date | Access-controlled audit query |

## 4.4 Financial Reports

| Report | Authority/source | Rule |
|---|---|---|
| Trial balance | Finance journal details | Posted journals only; debit = credit |
| General ledger | Finance journal/details | Account/date/branch filter; reversal visible |
| Income statement | Finance | Period/as-of, posted accounts only |
| Cash flow / cash position | Finance | Posted movement and account scope |
| Revenue reconciliation | Finance + Billing projection | Difference labelled and drillable by reference |
| Expense report | Finance | Approved/paid/posting state labelled |
| Daily closing | Finance | Approved closing and variance state |
| Payroll summary | HR approved + Finance reference | Restricted; payment/journal state explicit |

No financial report may calculate official accounting balances solely from Billing. Any mismatch between Billing collection and Finance posting is a reconciliation item, not a silent merge.

## 4.5 Inventory Reports

| Report | Source | Key output |
|---|---|---|
| Stock balance | Warehouse | Current, reserved, available, minimum, alert |
| Stock card | Warehouse ledger | In, out, running balance, reference |
| Movement | Warehouse | Purchase/treatment/transfer/adjustment/opname |
| Purchase | Warehouse | PO, receipt, vendor, lead time, status |
| Expiry | Warehouse batch | Near-expiry, expired, quarantine, quantity |
| Opname | Warehouse | System vs physical, variance, approval |

## 4.6 Human Resource Reports

| Report | Source | Key output |
|---|---|---|
| Headcount | HR employee | Active/terminated by branch/department/position |
| Attendance | HR | Present, late, absent, leave, correction |
| Leave and overtime | HR | Balance, utilisation, approval, duration |
| Payroll register | HR | Gross/deduction/net/status; restricted access |
| Contract/document expiry | HR | Upcoming expiry and completion status |

## 4.7 Clinical and Quality Reports

Clinical reports are aggregate and purpose-bound. Mereka dapat menampilkan visit, treatment, diagnosis/service category, provider workload, and outcome quality indicators only for authorised clinical/management roles. Identifiers and free-text EMR content are excluded by default. Any report requiring patient-level medical information follows EMR confidentiality rules and access justification.

---

