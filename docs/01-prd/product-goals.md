# Product Goals

> Source: derived from `docs/03-sad/01-system-overview.md` Section 2 (Business Goals, including Operational KPI) and Section 6 (Responsibility Matrix). No goal below is invented; each is copied or directly summarized from the SAD.

---

# 2. Business Goals

Parakita dibangun untuk mencapai tujuan strategis berikut.

## 2.1 Operational Goals

- Digitalisasi proses bisnis klinik.
- Mengurangi penggunaan dokumen fisik.
- Mengurangi human error.
- Meningkatkan efisiensi operasional.

---

## 2.2 Clinical Goals

- Menyediakan Electronic Medical Record (EMR).
- Menyediakan Odontogram interaktif.
- Mendukung pencatatan SOAP.
- Menyediakan riwayat tindakan per gigi.

---

## 2.3 Financial Goals

- Otomatisasi Billing.
- Otomatisasi Payment.
- Perhitungan jasa dokter.
- Monitoring pendapatan.
- Monitoring biaya operasional.

---

## 2.4 Operational KPI

Sistem dirancang untuk membantu pencapaian indikator berikut.

| KPI | Target |
|------|---------|
| Average Waiting Time | < 15 menit |
| Average Registration Time | < 5 menit |
| Average Doctor Service Time | Sesuai jenis tindakan |
| Invoice Accuracy | 100% |
| Inventory Accuracy | > 99% |
| Data Availability | 99.9% |

---

---

# Non-Functional Goals

In addition to the operational KPIs above, the system must meet the Architecture Quality Attributes defined in `docs/03-sad/01-system-overview.md` Section 17:

| Attribute | Target |
|------------|----------------------------|
| Availability | 99.9% |
| Performance | API < 500 ms |
| Scalability | Multi Branch Ready |
| Security | OWASP Top 10 Compliance |
| Maintainability | Modular Architecture |
| Reliability | ACID Transaction |
| Observability | Centralized Logging |
| Backup | Daily Backup |
| Disaster Recovery | Recovery Plan Available |
| Auditability | Full Audit Trail |
| Extensibility | Event Driven Architecture |

These non-functional targets are binding acceptance criteria for every module and must not be relaxed without an explicit change to `docs/03-sad/01-system-overview.md`.
