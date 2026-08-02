# Feature: EMR

> Source: derived from `docs/03-sad/15-module-emr.md`. Scope and use cases below are extracted directly from that document; no capability is added beyond what it specifies.

---

## Scope

# 3. Scope

## 3.1 In Scope

Module EMR mencakup:

- Visit Management
- SOAP Note
- Chief Complaint
- Medical History
- Dental History
- Family History
- Allergy
- Vital Sign
- Clinical Examination
- Diagnosis
- Treatment Plan
- Procedure
- Prescription
- Odontogram
- Tooth Condition
- Tooth Surface
- Periodontal Chart
- Clinical Attachment
- X-Ray
- Clinical Photo
- Medical Certificate
- Referral
- Follow Up
- Clinical Timeline
- Doctor Note
- Nurse Note

---

## 3.2 Out of Scope

Modul berikut tidak termasuk dalam EMR:

- Patient Registration
- Reservation
- Queue Management
- Billing
- Finance
- Warehouse Transaction
- Human Resource
- Reporting

EMR hanya menyediakan informasi klinis yang kemudian digunakan oleh modul-modul tersebut.

---


---

## Use Cases / Functional Flow

# 14. Use Case Catalog

## 14.1 Overview

Module EMR terdiri dari sekumpulan proses klinis yang saling terintegrasi. Seluruh proses tersebut dijalankan berdasarkan satu **Visit** aktif sehingga seluruh aktivitas medis terdokumentasi secara konsisten.

---

## Use Case Matrix

| Code | Use Case | Primary Actor |
|------|-----------------------------|----------------|
| EMR-001 | Open Visit | Doctor |
| EMR-002 | Record Vital Sign | Nurse |
| EMR-003 | Record SOAP Note | Doctor |
| EMR-004 | Record Medical History | Doctor |
| EMR-005 | Record Allergy | Doctor |
| EMR-006 | Clinical Examination | Doctor |
| EMR-007 | Record Diagnosis | Doctor |
| EMR-008 | Create Treatment Plan | Doctor |
| EMR-009 | Record Procedure | Doctor |
| EMR-010 | Create Prescription | Doctor |
| EMR-011 | Upload Clinical Attachment | Doctor |
| EMR-012 | Update Odontogram | Doctor |
| EMR-013 | Issue Medical Certificate | Doctor |
| EMR-014 | Create Referral | Doctor |
| EMR-015 | Close Visit | Doctor |

---

