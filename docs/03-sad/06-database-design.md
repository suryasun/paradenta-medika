# Parakita Software Architecture Document (SAD)

# 06 - Database Design

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 06 - Database Design |
| Part | 1 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Design Document (DDD) |
| Database | MySQL 8.x |
| ORM | Prisma ORM |
| Architecture Style | Clean Architecture + Domain Driven Design + Modular Monolith |
| Last Updated | July 2026 |

---

# Table of Contents (Part 1)

1. Introduction
2. Purpose
3. Scope
4. Relationship with Other Documents
5. Database Design Philosophy
6. Database Design Principles
7. Database Architecture
8. Modular Database Design
9. Database Naming Convention
10. Standard Audit Fields
11. Primary Key Strategy
12. Foreign Key Strategy
13. Soft Delete Strategy
14. Timestamp Strategy
15. Database Module Overview
16. High Level ERD
17. Future Considerations

---

# 1. Introduction

## 1.1 Overview

Dokumen ini menjelaskan desain database yang digunakan pada sistem **Parakita**.

Database dirancang untuk mendukung seluruh proses bisnis klinik gigi mulai dari registrasi pasien, reservasi, antrian, pemeriksaan, Electronic Medical Record (EMR), billing, keuangan, warehouse, human resource, hingga pelaporan.

Dokumen ini menjadi acuan utama bagi Backend Developer, Database Engineer, dan Solution Architect dalam membangun struktur database yang konsisten, mudah dipelihara, dan siap dikembangkan.

---

## 1.2 Background

Parakita menggunakan pendekatan:

- Domain Driven Design (DDD)
- Clean Architecture
- Modular Monolith

Pendekatan tersebut menyebabkan struktur database juga dibagi berdasarkan **Business Domain (Bounded Context)** sehingga setiap module memiliki kumpulan tabel yang jelas dan independen.

Walaupun seluruh tabel berada pada satu database MySQL, secara konseptual setiap domain memiliki ownership terhadap tabelnya masing-masing.

---

## 1.3 Objectives

Dokumen ini bertujuan untuk:

- Menjadi standar desain database.
- Menentukan struktur tabel setiap module.
- Menentukan relasi antar tabel.
- Menentukan aturan Primary Key dan Foreign Key.
- Menentukan strategi indexing.
- Menentukan standar audit field.
- Menentukan standar soft delete.
- Menjadi acuan implementasi Prisma Schema.
- Menjadi referensi pembuatan ERD.

---

# 2. Purpose

Database Design dibuat untuk memastikan seluruh data pada Parakita memiliki struktur yang:

- Konsisten
- Normalized
- Mudah dikembangkan
- Mudah di-query
- Mudah di-maintain
- Mendukung transaksi ACID
- Mendukung Audit Trail
- Siap dikembangkan menjadi Multi Branch

---

# 3. Scope

Dokumen ini membahas desain database untuk seluruh module berikut.

## Core Module

- Authentication
- Master Data
- Patient
- Reservation
- Queue
- EMR
- Billing
- Finance

## Supporting Module

- Warehouse
- Human Resource

## Generic Module

- Reporting
- System Administration
- Shared Resources

---

# 4. Relationship with Other Documents

Dokumen Database Design merupakan kelanjutan dari dokumen sebelumnya.

```text
01-System Overview
        │
        ▼
Business Requirement

        │

02-System Architecture
        │
        ▼
System Architecture

        │

03-Clean Architecture
        │
        ▼
Implementation Guideline

        │

04-Project Structure
        │
        ▼
Folder Organization

        │

05-Coding Standard
        │
        ▼
Coding Convention

        │

06-Database Design
        │
        ▼
Physical Database Design
```

---

# 5. Database Design Philosophy

## 5.1 Domain Driven Database

Database mengikuti pembagian **Bounded Context**.

Contoh:

```text
Patient Module

├── patients
├── patient_addresses
├── patient_contacts
└── patient_documents
```

Module lain tidak diperbolehkan melakukan manipulasi langsung terhadap tabel milik domain lain selain melalui Application Layer.

---

## 5.2 Normalization

Seluruh tabel dirancang minimal memenuhi:

- First Normal Form (1NF)
- Second Normal Form (2NF)
- Third Normal Form (3NF)

Denormalisasi hanya dilakukan apabila terdapat kebutuhan performa yang terukur.

---

## 5.3 Transaction Consistency

Seluruh transaksi mengikuti prinsip:

- Atomicity
- Consistency
- Isolation
- Durability (ACID)

Business transaction dikelola pada Application Layer sesuai prinsip Clean Architecture.

---

## 5.4 Scalability

Database dirancang agar mudah dikembangkan untuk:

- Multi Branch
- Multi Clinic
- Multi Doctor
- Multi Cashier
- Multi Warehouse

Tanpa perubahan struktur besar.

---

# 6. Database Design Principles

Seluruh tabel mengikuti prinsip berikut.

- Single Responsibility per Entity
- Consistent Naming
- Auditability
- Referential Integrity
- Soft Delete
- UTC Timestamp
- UUID Primary Key
- Foreign Key Constraint
- Index Optimization
- Future Multi Branch Ready

---

# 7. Database Architecture

```text
                Frontend
                    │
             REST API (Express)
                    │
            Application Layer
                    │
             Repository Layer
                    │
             Prisma ORM
                    │
               MySQL Database
```

Database hanya dapat diakses melalui Repository Layer.

Controller maupun Business Logic tidak diperbolehkan mengakses database secara langsung.

---

# 8. Modular Database Design

Database dibagi berdasarkan Business Domain.

```text
Authentication

Master Data

Patient

Reservation

Queue

EMR

Billing

Finance

Warehouse

HR

Reporting

System
```

Setiap module memiliki ownership terhadap tabelnya masing-masing.

---

# 9. Database Naming Convention

## 9.1 Table Naming

Gunakan:

- lowercase
- snake_case
- plural noun

Contoh:

```text
patients

patient_addresses

patient_contacts

medical_attachments

invoice_items
```

---

## 9.2 Column Naming

Gunakan:

```text
snake_case
```

Contoh:

```text
patient_name

birth_date

doctor_id

created_at

updated_at
```

---

## 9.3 Primary Key

Semua Primary Key menggunakan nama:

```text
id
```

---

## 9.4 Foreign Key

Gunakan pola:

```text
patient_id

doctor_id

reservation_id

invoice_id
```

---

## 9.5 Pivot Table

Gunakan kombinasi nama entity.

Contoh:

```text
visit_treatments

patient_allergies

role_permissions
```

---

# 10. Standard Audit Fields

Seluruh tabel transactional wajib memiliki field berikut.

| Column | Type | Description |
|---------|------|-------------|
| created_at | datetime | Waktu dibuat |
| created_by | uuid | User pembuat |
| updated_at | datetime | Waktu perubahan |
| updated_by | uuid | User pengubah |
| deleted_at | datetime nullable | Soft Delete |
| deleted_by | uuid nullable | User penghapus |

Audit field memungkinkan seluruh perubahan data dapat ditelusuri.

---

# 11. Primary Key Strategy

Seluruh tabel menggunakan UUID.

Contoh:

```text
id CHAR(36)
```

Keuntungan:

- Aman untuk sinkronisasi multi cabang
- Tidak mudah ditebak
- Mendukung distributed architecture di masa depan

---

# 12. Foreign Key Strategy

Seluruh relasi menggunakan Foreign Key.

Contoh:

```text
patients
        │
        ▼
reservations

reservations
        │
        ▼
visits

visits
        │
        ▼
invoices
```

Prinsip:

- Selalu menjaga referential integrity.
- Menggunakan constraint sesuai kebutuhan bisnis.
- Cascade delete dihindari pada data transaksi.

---

# 13. Soft Delete Strategy

Seluruh data transaksi menggunakan Soft Delete.

Field yang digunakan:

```text
deleted_at

deleted_by
```

Data tidak dihapus secara fisik agar:

- Audit tetap tersedia
- Riwayat transaksi tetap terjaga
- Relasi data tidak rusak

Master data tertentu dapat menggunakan hard delete apabila belum pernah digunakan pada transaksi.

---

# 14. Timestamp Strategy

Seluruh timestamp menggunakan standar:

- UTC Time
- DATETIME(3)
- Presisi millisecond

Contoh:

```text
2026-07-30 14:35:28.152
```

Konversi ke timezone lokal dilakukan pada Application Layer.

---

# 15. Database Module Overview

| Module | Estimated Tables |
|----------|----------------:|
| Authentication & System | 12 |
| Master Data | 20 |
| Patient | 8 |
| Reservation | 6 |
| Queue | 4 |
| EMR | 18 |
| Billing | 10 |
| Finance | 12 |
| Warehouse | 15 |
| Human Resource | 12 |
| Shared Module | 8 |
| **Total** | **±125 Tables** |

Jumlah tabel dapat berubah sesuai kebutuhan bisnis pada tahap implementasi.

---

# 16. High Level ERD

```text
Patient
    │
    ▼
Reservation
    │
    ▼
Queue
    │
    ▼
Visit
    │
    ▼
EMR
    │
    ├─────────────┐
    ▼             ▼
Billing     Warehouse
    │             │
    └──────┬──────┘
           ▼
        Finance
           │
           ▼
       Reporting
```

Diagram di atas menunjukkan hubungan antar bounded context pada level konseptual.

---

# 17. Future Considerations

Database telah dipersiapkan untuk mendukung pengembangan berikut.

- Multi Branch
- Multi Company
- Multi Warehouse
- WhatsApp Integration
- Insurance Integration
- BPJS Integration
- Payment Gateway
- Business Intelligence
- Data Warehouse
- Microservices Migration
- Read Replica
- Database Partitioning

---

# Summary Part 1

Part 1 mendefinisikan filosofi, prinsip, dan standar desain database Parakita. Dokumen ini menjadi fondasi bagi seluruh implementasi database dengan pendekatan **Domain Driven Design**, **Clean Architecture**, dan **Modular Monolith**.

Pada bagian berikutnya akan dijelaskan secara rinci struktur tabel untuk **System, Authentication, dan Master Data**, termasuk definisi kolom, relasi, constraint, index, dan business purpose dari setiap tabel.

# Parakita Software Architecture Document (SAD)

# 06 - Database Design

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 06 - Database Design |
| Part | 2 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Design Document (DDD) |
| Database | MySQL 8.x |
| ORM | Prisma ORM |

---

# Table of Contents (Part 2)

18. System Module
19. Authentication Module
20. Authorization Module
21. System Configuration Module
22. Activity & Audit Module
23. Master Data Module
24. Branch & Clinic Master
25. Employee & Doctor Master
26. Geographic Master
27. Lookup Master
28. Payment Master
29. Module Relationship

---

# 18. System Module

## 18.1 Overview

System Module merupakan fondasi seluruh aplikasi.

Module ini menyediakan:

- User Management
- Authentication
- Authorization
- Configuration
- Menu
- Audit
- Activity Log

Seluruh module bergantung pada System Module.

---

# 19. Authentication Module

## 19.1 Tables

| Table | Purpose |
|---------|----------------------------|
| users | User Login |
| user_sessions | Login Session |
| refresh_tokens | JWT Refresh Token |
| login_histories | Login Activity |

---

## 19.2 users

### Purpose

Menyimpan seluruh akun pengguna aplikasi.

### Columns

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| employee_id | UUID | Relasi ke Employee |
| username | varchar(50) | Username |
| email | varchar(100) | Email |
| password_hash | varchar(255) | Password Hash |
| status | enum | Active / Inactive |
| last_login_at | datetime | Login terakhir |
| created_at | datetime | Audit |
| created_by | UUID | Audit |
| updated_at | datetime | Audit |
| updated_by | UUID | Audit |
| deleted_at | datetime | Soft Delete |
| deleted_by | UUID | Audit |

### Index

```text
PK(id)

UK(username)

UK(email)

IDX(employee_id)
```

---

## 19.3 user_sessions

### Purpose

Menyimpan session login aktif.

### Columns

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID |
| device_name | varchar(100) |
| device_type | varchar(30) |
| browser | varchar(50) |
| ip_address | varchar(45) |
| refresh_token | text |
| expired_at | datetime |
| revoked_at | datetime |
| created_at | datetime |

---

## 19.4 refresh_tokens

Digunakan untuk implementasi JWT Refresh Token.

| Column |
|---------|
| id |
| user_id |
| token |
| expired_at |
| revoked_at |
| created_at |

---

## 19.5 login_histories

Mencatat aktivitas login.

| Column |
|---------|
| id |
| user_id |
| login_time |
| logout_time |
| ip_address |
| browser |
| device |
| login_status |

---

# 20. Authorization Module

## 20.1 Tables

| Table |
|---------|
| roles |
| permissions |
| role_permissions |
| user_roles |
| menus |

---

## 20.2 roles

### Purpose

Master Role aplikasi.

Contoh:

- Administrator
- Doctor
- Nurse
- Cashier
- Warehouse
- Finance
- HR
- Owner

### Columns

| Column |
|---------|
| id |
| role_code |
| role_name |
| description |
| is_system |
| created_at |
| updated_at |

---

## 20.3 permissions

Permission terkecil pada sistem.

Contoh:

```text
patient.create

patient.update

patient.delete

billing.payment

billing.refund

finance.closing
```

### Columns

| Column |
|---------|
| id |
| module |
| permission_key |
| permission_name |
| description |

---

## 20.4 role_permissions

Pivot Role dan Permission.

| Column |
|---------|
| id |
| role_id |
| permission_id |

Unique:

```text
(role_id, permission_id)
```

---

## 20.5 user_roles

Relasi User terhadap Role.

| Column |
|---------|
| id |
| user_id |
| role_id |

---

## 20.6 menus

Menu yang tampil pada frontend.

| Column |
|---------|
| id |
| parent_id |
| menu_code |
| menu_name |
| route |
| icon |
| sort_order |
| permission_key |

---

# 21. System Configuration Module

## Tables

| Table |
|---------|
| system_parameters |
| application_settings |

---

## 21.1 system_parameters

Konfigurasi global aplikasi.

Contoh:

```text
Clinic Name

Timezone

Invoice Prefix

Patient Number Prefix

Reservation Interval

Maximum Queue

Default Currency
```

### Columns

| Column |
|---------|
| id |
| parameter_group |
| parameter_key |
| parameter_value |
| description |

---

## 21.2 application_settings

Konfigurasi UI maupun fitur.

Contoh:

- Theme
- Logo
- SMTP
- Upload Limit
- Password Policy

---

# 22. Activity & Audit Module

## Tables

| Table |
|---------|
| audit_logs |
| activity_logs |

---

## 22.1 audit_logs

Audit seluruh perubahan data.

### Columns

| Column |
|---------|
| id |
| module |
| table_name |
| record_id |
| action |
| old_value |
| new_value |
| user_id |
| ip_address |
| user_agent |
| created_at |

---

## 22.2 activity_logs

Activity operasional.

Contoh:

- Login
- Generate Invoice
- Payment
- Refund
- Check In
- Start Visit

### Columns

| Column |
|---------|
| id |
| module |
| activity |
| reference_id |
| user_id |
| created_at |

---

# 23. Master Data Module

## Overview

Master Data digunakan oleh seluruh module.

```text
Master Data

├── Branch

├── Clinic

├── Department

├── Doctor

├── Employee

├── Occupation

├── Insurance

├── Bank

├── Payment Method

├── Geographic

├── Diagnosis Code

├── Tooth Condition

└── Treatment Category
```

---

# 24. Branch & Clinic Master

## branches

### Purpose

Data cabang klinik.

### Columns

| Column |
|---------|
| id |
| branch_code |
| branch_name |
| phone |
| email |
| address |
| city_id |
| status |

---

## clinics

Apabila satu perusahaan memiliki beberapa klinik dalam satu cabang.

| Column |
|---------|
| id |
| branch_id |
| clinic_code |
| clinic_name |

---

## departments

Contoh:

- Registration
- Medical
- Cashier
- Warehouse
- Finance

---

# 25. Employee & Doctor Master

## employees

Master seluruh pegawai.

### Columns

| Column |
|---------|
| id |
| employee_no |
| full_name |
| gender |
| birth_date |
| phone |
| email |
| occupation_id |
| branch_id |
| join_date |
| employment_status |

---

## doctors

Informasi tambahan dokter.

### Columns

| Column |
|---------|
| id |
| employee_id |
| sip_number |
| str_number |
| specialization_id |
| consultation_fee |
| active |

---

## doctor_specializations

Master spesialisasi.

Contoh:

- General Dentist
- Orthodontist
- Prosthodontist
- Oral Surgeon

---

## doctor_schedules

Jadwal praktik dokter.

| Column |
|---------|
| id |
| doctor_id |
| day_of_week |
| start_time |
| end_time |
| slot_duration |
| max_patient |

---

# 26. Geographic Master

Digunakan oleh Patient maupun Employee.

## Tables

```text
provinces

cities

districts

villages
```

Relasi:

```text
Province

↓

City

↓

District

↓

Village
```

---

# 27. Lookup Master

Master referensi sistem.

## Tables

```text
religions

marital_statuses

occupations

patient_groups

diagnosis_codes

tooth_conditions

treatment_categories
```

Lookup ini bersifat relatif statis dan digunakan oleh berbagai modul.

---

# 28. Payment Master

## payment_methods

Contoh:

- Cash
- Debit
- Credit Card
- Transfer
- QRIS

---

## banks

Digunakan pada transaksi transfer.

---

## insurance_companies

Digunakan untuk data penjamin pasien.

---

# 29. Module Relationship

```text
                    users
                      │
        ┌─────────────┼─────────────┐
        │             │             │
     roles        sessions      audit_logs
        │
        ▼
permissions

Master Data
      │
      ├──────────────┐
      ▼              ▼
 employees       branches
      │              │
      ▼              ▼
   doctors       clinics
      │
      ▼
doctor_schedules
```

---

# Summary Part 2

Part 2 mendefinisikan struktur database untuk **System**, **Authentication**, **Authorization**, dan **Master Data**. Modul-modul ini menjadi fondasi bagi seluruh domain bisnis Parakita dan menyediakan layanan lintas modul seperti autentikasi, otorisasi, konfigurasi sistem, audit, aktivitas pengguna, serta data referensi yang digunakan oleh Patient, Reservation, EMR, Billing, Finance, Warehouse, dan HR.

Pada **Part 3**, pembahasan akan berfokus pada **Patient Module**, **Reservation Module**, dan **Queue Module**, termasuk desain tabel, relasi, serta alur data dari registrasi pasien hingga proses check-in dan antrian.


# Parakita Software Architecture Document (SAD)

# 06 - Database Design

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 06 - Database Design |
| Part | 3 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Design Document (DDD) |
| Database | MySQL 8.x |
| ORM | Prisma ORM |

---

# Table of Contents (Part 3)

30. Patient Module
31. Patient Relationship
32. Reservation Module
33. Reservation Relationship
34. Queue Module
35. Queue Relationship
36. Cross Module Relationship
37. Entity Relationship Diagram (Patient Flow)

---

# 30. Patient Module

## 30.1 Overview

Patient Module merupakan pintu masuk seluruh proses bisnis klinik.

Module ini bertanggung jawab terhadap:

- Registrasi Pasien
- Identitas Pasien
- Kontak Pasien
- Riwayat Medis Dasar
- Dokumen Pasien
- Data Penjamin
- Informasi Alergi

Seluruh proses Reservation, EMR, Billing, dan Reporting bergantung pada data Patient.

---

## 30.2 Tables

| Table | Purpose |
|---------|-----------------------------|
| patients | Master Pasien |
| patient_addresses | Alamat Pasien |
| patient_contacts | Kontak Darurat |
| patient_allergies | Riwayat Alergi |
| patient_medical_histories | Riwayat Penyakit |
| patient_insurances | Data Penjamin |
| patient_documents | Dokumen Pendukung |
| patient_notes | Catatan Administratif |

---

# 30.3 patients

## Purpose

Menyimpan identitas utama pasien.

---

## Columns

| Column | Type | Description |
|---------|------|-------------|
| id | UUID | Primary Key |
| medical_record_no | varchar(30) | Nomor Rekam Medis |
| patient_name | varchar(150) | Nama Lengkap |
| identity_type | enum | KTP / Passport / SIM |
| identity_number | varchar(50) | Nomor Identitas |
| birth_place | varchar(100) | Tempat Lahir |
| birth_date | date | Tanggal Lahir |
| gender | enum | Male / Female |
| blood_type | enum | Golongan Darah |
| religion_id | UUID | Master Religion |
| marital_status_id | UUID | Master Status |
| occupation_id | UUID | Master Occupation |
| phone | varchar(30) | Nomor HP |
| email | varchar(100) | Email |
| patient_group_id | UUID | Group Pasien |
| registration_date | datetime | Registrasi |
| active | boolean | Status Aktif |
| created_at | datetime | Audit |
| created_by | UUID | Audit |
| updated_at | datetime | Audit |
| updated_by | UUID | Audit |
| deleted_at | datetime | Soft Delete |
| deleted_by | UUID | Audit |

---

## Unique Index

```text
UK(medical_record_no)

UK(identity_type, identity_number)
```

---

## Secondary Index

```text
IDX(patient_name)

IDX(phone)

IDX(active)
```

---

# 30.4 patient_addresses

## Purpose

Satu pasien dapat memiliki beberapa alamat.

---

## Columns

```text
id

patient_id

address_type

province_id

city_id

district_id

village_id

postal_code

address

is_primary
```

---

# 30.5 patient_contacts

Kontak keluarga atau penanggung jawab.

```text
id

patient_id

contact_name

relationship

phone

address

is_emergency_contact
```

---

# 30.6 patient_allergies

Riwayat alergi pasien.

```text
id

patient_id

allergy_type

allergy_name

severity

note
```

Contoh:

- Obat
- Makanan
- Latex
- Anestesi

---

# 30.7 patient_medical_histories

Riwayat penyakit.

```text
id

patient_id

disease_name

diagnosed_date

status

note
```

---

# 30.8 patient_insurances

Penjamin pasien.

```text
id

patient_id

insurance_company_id

card_number

member_name

expired_date

is_primary
```

---

# 30.9 patient_documents

Lampiran pasien.

```text
id

patient_id

attachment_id

document_type

description
```

---

# 30.10 patient_notes

Catatan administratif.

```text
id

patient_id

note

created_by

created_at
```

---

# 31. Patient Relationship

```text
patients
    │
    ├────────── patient_addresses
    │
    ├────────── patient_contacts
    │
    ├────────── patient_allergies
    │
    ├────────── patient_medical_histories
    │
    ├────────── patient_insurances
    │
    ├────────── patient_documents
    │
    └────────── patient_notes
```

---

# 32. Reservation Module

## 32.1 Overview

Reservation Module mengelola seluruh proses booking pasien.

Mendukung:

- Walk In
- Appointment
- Reschedule
- Cancel
- Check In

---

## 32.2 Tables

| Table | Purpose |
|---------|---------------------------|
| reservations | Reservasi |
| reservation_services | Layanan |
| reservation_status_histories | Riwayat Status |
| reservation_notes | Catatan |
| checkins | Check In |
| doctor_timeslots | Jadwal Dokter |

---

# 32.3 reservations

## Columns

| Column | Type |
|---------|------|
| id | UUID |
| reservation_no | varchar(30) |
| patient_id | UUID |
| doctor_id | UUID |
| branch_id | UUID |
| reservation_date | date |
| reservation_time | time |
| reservation_type | enum |
| complaint | text |
| status | enum |
| source | enum |
| created_at | datetime |
| created_by | UUID |

---

## Reservation Status

```text
BOOKED

CONFIRMED

CHECK_IN

IN_QUEUE

SERVING

COMPLETED

CANCELLED

NO_SHOW
```

---

## Reservation Source

```text
Walk In

Phone

WhatsApp

Website

Mobile App
```

---

## Index

```text
UK(reservation_no)

IDX(patient_id)

IDX(doctor_id)

IDX(reservation_date)

IDX(status)
```

---

# 32.4 reservation_services

Layanan yang dipilih saat reservasi.

```text
id

reservation_id

treatment_category_id

estimated_duration

estimated_price
```

---

# 32.5 reservation_status_histories

Riwayat perubahan status.

```text
id

reservation_id

status

changed_by

changed_at

remark
```

---

# 32.6 reservation_notes

Catatan petugas.

```text
id

reservation_id

note

created_by

created_at
```

---

# 32.7 checkins

Data check in.

```text
id

reservation_id

checkin_time

counter

checked_in_by
```

---

# 32.8 doctor_timeslots

Slot jadwal praktik.

```text
id

doctor_schedule_id

slot_date

start_time

end_time

quota

reserved_count
```

---

# 33. Reservation Relationship

```text
patients
      │
      ▼
reservations
      │
      ├──────── reservation_services
      │
      ├──────── reservation_notes
      │
      ├──────── reservation_status_histories
      │
      └──────── checkins
```

---

# 34. Queue Module

## 34.1 Overview

Queue Module mengatur urutan pelayanan pasien.

Queue dibuat setelah pasien melakukan Check In.

---

## Tables

| Table | Purpose |
|---------|----------------|
| queues | Antrian |
| queue_calls | Pemanggilan |
| queue_transfers | Transfer Queue |
| queue_histories | Riwayat Queue |

---

# 34.2 queues

## Columns

```text
id

reservation_id

queue_number

queue_date

doctor_id

room

priority

status

current_position

estimated_call_time

created_at
```

---

## Queue Status

```text
WAITING

CALLED

SERVING

SKIPPED

COMPLETED

CANCELLED
```

---

## Priority

```text
NORMAL

ELDERLY

PREGNANT

EMERGENCY

VIP
```

---

## Index

```text
IDX(queue_date)

IDX(status)

IDX(doctor_id)

UK(queue_number, queue_date)
```

---

# 34.3 queue_calls

Riwayat pemanggilan.

```text
id

queue_id

called_at

called_by

call_number
```

---

# 34.4 queue_transfers

Transfer antar dokter.

```text
id

queue_id

from_doctor_id

to_doctor_id

reason

transferred_at
```

---

# 34.5 queue_histories

Riwayat perubahan queue.

```text
id

queue_id

status

remark

created_at

created_by
```

---

# 35. Queue Relationship

```text
reservations
      │
      ▼
queues
      │
      ├──────── queue_calls
      │
      ├──────── queue_transfers
      │
      └──────── queue_histories
```

---

# 36. Cross Module Relationship

```text
Patient
     │
     ▼
Reservation
     │
     ▼
Check In
     │
     ▼
Queue
     │
     ▼
Visit (EMR)
```

Seluruh transaksi EMR dimulai dari Queue yang telah dipanggil.

---

# 37. Entity Relationship Diagram (Patient Flow)

```text
patients
    │
    ├──────────────┐
    │              │
    ▼              ▼
patient_addresses  patient_contacts
    │
    ▼
patient_allergies
    │
    ▼
patient_medical_histories
    │
    ▼
patient_insurances
    │
    ▼
reservations
    │
    ├──────── reservation_services
    │
    ├──────── reservation_status_histories
    │
    ├──────── reservation_notes
    │
    └──────── checkins
                │
                ▼
              queues
                │
                ├──────── queue_calls
                ├──────── queue_transfers
                └──────── queue_histories
```

---

# Summary Part 3

Part 3 mendefinisikan struktur database untuk **Patient**, **Reservation**, dan **Queue Module** sebagai fondasi alur pelayanan pasien. Relasi antar tabel dirancang mengikuti proses bisnis klinik, mulai dari registrasi pasien, pembuatan reservasi, check-in, hingga pembentukan antrian yang akan menjadi titik awal proses **Visit** pada modul **Electronic Medical Record (EMR)**.

Pada **Part 4**, akan dibahas **EMR Module** secara lengkap, termasuk tabel **visits**, **SOAP Notes**, **Odontogram**, **Diagnosis**, **Treatment**, **Prescription**, **Medical Attachment**, serta relasinya dengan **Billing** dan **Warehouse**.

# Parakita Software Architecture Document (SAD)

# 06 - Database Design

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 06 - Database Design |
| Part | 4 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Design Document (DDD) |
| Database | MySQL 8.x |
| ORM | Prisma ORM |

---

# Table of Contents (Part 4)

38. Electronic Medical Record (EMR) Module
39. Visit Management
40. SOAP Notes
41. Vital Signs
42. Odontogram
43. Diagnosis
44. Treatment
45. Prescription
46. Medical Attachment
47. EMR Relationship
48. Integration with Billing & Warehouse

---

# 38. Electronic Medical Record (EMR) Module

## 38.1 Overview

Electronic Medical Record (EMR) merupakan **Core Domain** pada Parakita.

Seluruh aktivitas pemeriksaan dokter akan disimpan pada module ini.

EMR menjadi sumber data utama untuk:

- Riwayat Pemeriksaan
- Diagnosis
- Odontogram
- SOAP Note
- Treatment
- Resep Obat
- Billing
- Pengurangan Stock
- Reporting

---

## 38.2 Tables

| Table | Purpose |
|---------|----------------------------|
| visits | Kunjungan Pasien |
| soap_notes | SOAP Record |
| vital_signs | Pemeriksaan Awal |
| odontograms | Header Odontogram |
| odontogram_teeth | Detail Gigi |
| diagnoses | Master Diagnosis Visit |
| visit_diagnoses | Relasi Diagnosis |
| treatments | Master Tindakan Visit |
| visit_treatments | Detail Treatment |
| treatment_materials | Material yang digunakan |
| prescriptions | Header Resep |
| prescription_items | Detail Resep |
| medical_attachments | Lampiran Medis |
| doctor_notes | Catatan Dokter |
| treatment_progress | Progress Perawatan |
| doctor_discounts | Diskon Dokter |
| medical_certificates | Surat Medis |
| visit_histories | Riwayat Visit |

---

# 39. Visit Management

## 39.1 visits

Visit merupakan root entity seluruh EMR.

Setiap pasien yang dipanggil dari Queue akan menghasilkan satu Visit.

---

## Columns

| Column | Type |
|---------|------|
| id | UUID |
| visit_no | varchar(30) |
| reservation_id | UUID |
| patient_id | UUID |
| doctor_id | UUID |
| queue_id | UUID |
| visit_date | datetime |
| chief_complaint | text |
| status | enum |
| started_at | datetime |
| finished_at | datetime |
| created_at | datetime |
| updated_at | datetime |

---

## Visit Status

```text
WAITING

IN_PROGRESS

ON_HOLD

COMPLETED

CANCELLED
```

---

## Index

```text
UK(visit_no)

IDX(patient_id)

IDX(doctor_id)

IDX(visit_date)

IDX(status)
```

---

# 40. SOAP Notes

## 40.1 soap_notes

SOAP merupakan catatan pemeriksaan dokter.

---

## Columns

```text
id

visit_id

subjective

objective

assessment

plan

created_at

updated_at
```

Relasi:

```text
Visit

↓

SOAP Note
```

Satu Visit memiliki satu SOAP Note.

---

# 41. Vital Signs

## 41.1 vital_signs

Pemeriksaan awal pasien.

---

## Columns

```text
id

visit_id

height

weight

temperature

blood_pressure

pulse

respiration_rate

oxygen_saturation

pain_scale

created_at
```

---

# 42. Odontogram

## 42.1 Overview

Odontogram menyimpan kondisi seluruh gigi pasien.

Setiap Visit dapat menghasilkan perubahan kondisi gigi.

---

## Tables

```text
odontograms

odontogram_teeth
```

---

## odontograms

Header odontogram.

```text
id

visit_id

created_by

created_at
```

---

## odontogram_teeth

Detail setiap gigi.

---

## Columns

| Column |
|---------|
| id |
| odontogram_id |
| tooth_number |
| tooth_surface |
| tooth_condition_id |
| treatment_status |
| note |

---

## Contoh Tooth Number

```text
11

12

13

21

22

23

31

32

41

42
```

Mengikuti standar **FDI World Dental Federation**.

---

## Tooth Surface

```text
O

M

D

B

L

I
```

---

# 43. Diagnosis

## 43.1 diagnoses

Header diagnosis visit.

```text
id

visit_id

primary_diagnosis

secondary_diagnosis

created_at
```

---

## 43.2 visit_diagnoses

Relasi diagnosis detail.

```text
id

visit_id

diagnosis_code_id

diagnosis_type

remark
```

---

## Diagnosis Type

```text
PRIMARY

SECONDARY
```

---

# 44. Treatment

## 44.1 treatments

Header tindakan.

```text
id

visit_id

doctor_id

treatment_date

note
```

---

## 44.2 visit_treatments

Detail tindakan.

| Column |
|---------|
| id |
| treatment_id |
| treatment_category_id |
| tooth_number |
| qty |
| price |
| discount |
| subtotal |

---

## 44.3 treatment_materials

Material yang digunakan.

```text
id

visit_treatment_id

item_id

qty

unit_id
```

Digunakan untuk otomatis mengurangi stok Warehouse.

---

# 45. Prescription

## Tables

```text
prescriptions

prescription_items
```

---

## prescriptions

Header resep.

```text
id

visit_id

doctor_id

prescription_date

note
```

---

## prescription_items

Detail obat.

```text
id

prescription_id

item_id

dosage

frequency

duration

instruction

qty
```

---

# 46. Medical Attachment

## medical_attachments

Lampiran pemeriksaan.

Contoh:

- Foto Intra Oral
- Foto Extra Oral
- Hasil X-Ray
- CT Scan
- PDF
- Surat Rujukan

---

## Columns

```text
id

visit_id

attachment_id

attachment_type

description

uploaded_by

uploaded_at
```

---

## doctor_notes

Catatan tambahan dokter.

```text
id

visit_id

note

created_by

created_at
```

---

## treatment_progress

Digunakan pada treatment multi visit.

```text
id

visit_treatment_id

progress_date

progress_note

status
```

---

## doctor_discounts

Diskon khusus tindakan.

```text
id

visit_id

discount_type

amount

reason
```

---

## medical_certificates

Surat medis.

```text
id

visit_id

certificate_type

certificate_no

issued_date

remark
```

---

## visit_histories

Riwayat perubahan Visit.

```text
id

visit_id

status

changed_by

changed_at

remark
```

---

# 47. EMR Relationship

```text
visits
    │
    ├──────── soap_notes
    │
    ├──────── vital_signs
    │
    ├──────── odontograms
    │              │
    │              ▼
    │      odontogram_teeth
    │
    ├──────── diagnoses
    │
    ├──────── visit_diagnoses
    │
    ├──────── treatments
    │              │
    │              ▼
    │      visit_treatments
    │              │
    │              ▼
    │      treatment_materials
    │
    ├──────── prescriptions
    │              │
    │              ▼
    │      prescription_items
    │
    ├──────── medical_attachments
    │
    ├──────── doctor_notes
    │
    ├──────── treatment_progress
    │
    ├──────── doctor_discounts
    │
    ├──────── medical_certificates
    │
    └──────── visit_histories
```

---

# 48. Integration with Billing & Warehouse

EMR menjadi sumber transaksi untuk module lain.

```text
Reservation

↓

Visit

↓

Treatment

↓

Billing

↓

Payment
```

Sedangkan penggunaan material akan mengurangi stok.

```text
Visit Treatment

↓

Treatment Material

↓

Warehouse Stock

↓

Stock Transaction
```

Relasi lintas modul:

```text
Patient
      │
      ▼
Reservation
      │
      ▼
Queue
      │
      ▼
Visit
      │
      ├──────── SOAP
      ├──────── Diagnosis
      ├──────── Odontogram
      ├──────── Treatment
      ├──────── Prescription
      │
      ├────────► Billing
      │
      └────────► Warehouse
```

---

# Summary Part 4

Part 4 mendefinisikan struktur database **Electronic Medical Record (EMR)** sebagai **core domain** pada Parakita. Modul ini mencakup seluruh data klinis pasien, mulai dari **Visit**, **SOAP Notes**, **Vital Signs**, **Odontogram**, **Diagnosis**, **Treatment**, **Prescription**, hingga **Medical Attachment** dan riwayat tindakan.

Desain ini juga menetapkan integrasi EMR dengan **Billing** untuk pembentukan tagihan serta **Warehouse** untuk pencatatan penggunaan material medis, sehingga seluruh alur pelayanan pasien terdokumentasi secara lengkap dan konsisten.


# Parakita Software Architecture Document (SAD)

# 06 - Database Design

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 06 - Database Design |
| Part | 5 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Design Document (DDD) |
| Database | MySQL 8.x |
| ORM | Prisma ORM |

---

# Table of Contents (Part 5)

49. Billing Module
50. Finance Module
51. Warehouse Module
52. Human Resource Module
53. Shared Module
54. Database Constraints
55. Indexing Strategy
56. Data Archiving Strategy
57. Backup & Recovery Strategy
58. Database Security
59. Future Database Evolution
60. Complete Database Relationship
61. Summary

---

# 49. Billing Module

## 49.1 Overview

Billing Module bertanggung jawab terhadap seluruh transaksi finansial yang berasal dari pelayanan medis.

Billing menerima data dari:

- Visit
- Treatment
- Prescription
- Medical Certificate
- Additional Service

Output Billing adalah Invoice yang kemudian diproses oleh Finance.

---

## 49.2 Tables

| Table | Purpose |
|---------|---------------------------|
| invoices | Header Invoice |
| invoice_items | Detail Invoice |
| payments | Pembayaran |
| payment_allocations | Alokasi Pembayaran |
| discounts | Diskon |
| refunds | Refund |
| receipts | Bukti Pembayaran |
| doctor_fees | Fee Dokter |
| invoice_histories | Riwayat Invoice |
| cashier_shift_transactions | Transaksi Shift Kasir |

---

## invoices

### Columns

```text
id
invoice_no
visit_id
patient_id
branch_id
invoice_date
subtotal
discount
tax
grand_total
payment_status
status
created_at
updated_at
```

---

## invoice_items

```text
id
invoice_id
reference_type
reference_id
description
qty
unit_price
discount
subtotal
```

Reference Type:

```text
TREATMENT
MEDICINE
LAB
RADIOLOGY
CERTIFICATE
OTHER
```

---

## payments

```text
id
invoice_id
payment_method_id
payment_date
amount
reference_no
bank_id
received_by
note
```

---

## payment_allocations

Digunakan apabila satu pembayaran digunakan untuk beberapa invoice.

```text
id
payment_id
invoice_id
allocated_amount
```

---

## discounts

```text
id
invoice_id
discount_type
percentage
amount
reason
approved_by
```

---

## refunds

```text
id
payment_id
refund_date
refund_amount
reason
approved_by
```

---

## doctor_fees

```text
id
visit_treatment_id
doctor_id
fee_percentage
fee_amount
status
```

---

# 50. Finance Module

## Overview

Finance menangani pencatatan akuntansi dan kas.

---

## Tables

| Table |
|---------|
| accounts |
| journal_entries |
| journal_details |
| cash_accounts |
| income_categories |
| expense_categories |
| expenses |
| cash_movements |
| daily_closings |
| doctor_fee_settlements |
| financial_periods |
| taxes |

---

## journal_entries

Header jurnal.

```text
id
journal_no
journal_date
reference_type
reference_id
description
created_by
```

---

## journal_details

```text
id
journal_entry_id
account_id
debit
credit
description
```

Constraint:

```text
SUM(Debit)=SUM(Credit)
```

---

## cash_movements

```text
id
cash_account_id
movement_type
reference_type
reference_id
amount
movement_date
```

---

## daily_closings

```text
id
branch_id
closing_date
cashier_id
opening_balance
closing_balance
difference
approved_by
```

---

# 51. Warehouse Module

## Overview

Warehouse mengelola seluruh persediaan barang.

Seluruh penggunaan material berasal dari EMR.

---

## Tables

| Table |
|---------|
| items |
| item_categories |
| units |
| suppliers |
| purchases |
| purchase_items |
| warehouses |
| warehouse_stocks |
| stock_transactions |
| stock_adjustments |
| stock_opnames |
| stock_opname_items |
| item_batches |
| item_mutations |
| stock_alerts |

---

## items

```text
id
item_code
item_name
category_id
unit_id
minimum_stock
purchase_price
selling_price
active
```

---

## warehouse_stocks

```text
id
warehouse_id
item_id
current_stock
reserved_stock
available_stock
```

---

## stock_transactions

```text
id
warehouse_id
item_id
transaction_type
reference_type
reference_id
qty_in
qty_out
balance
transaction_date
```

Transaction Type

```text
PURCHASE
SALE
TREATMENT
ADJUSTMENT
TRANSFER
OPNAME
RETURN
```

---

# 52. Human Resource Module

## Tables

| Table |
|---------|
| employees |
| employee_positions |
| employee_salaries |
| attendance |
| leave_requests |
| overtimes |
| payrolls |
| payroll_items |
| employee_documents |
| employee_contracts |
| employee_bank_accounts |
| employee_histories |

---

## payrolls

```text
id
employee_id
period
basic_salary
allowance
deduction
net_salary
status
```

---

## attendance

```text
id
employee_id
attendance_date
check_in
check_out
status
```

---

# 53. Shared Module

Shared Module digunakan oleh seluruh Business Domain.

---

## Tables

| Table |
|---------|
| attachments |
| attachment_categories |
| notifications |
| notification_reads |
| activity_logs |
| audit_logs |
| background_jobs |
| job_logs |

---

## attachments

Digunakan oleh:

- Patient
- EMR
- HR
- Finance
- Warehouse

### Columns

```text
id
file_name
original_name
mime_type
file_size
storage_path
storage_provider
uploaded_by
uploaded_at
```

---

## notifications

```text
id
user_id
title
message
notification_type
is_read
created_at
```

---

## background_jobs

```text
id
job_name
payload
status
started_at
finished_at
```

---

# 54. Database Constraints

## Unique Constraint

Contoh:

```text
medical_record_no

username

email

invoice_no

reservation_no

visit_no

item_code
```

---

## Foreign Key Constraint

Semua relasi antar tabel menggunakan Foreign Key.

Contoh:

```text
patient_id

doctor_id

reservation_id

visit_id

invoice_id
```

---

## Check Constraint

Contoh:

```text
subtotal >= 0

discount >= 0

grand_total >= 0

qty >= 0

stock >= 0
```

---

# 55. Indexing Strategy

Seluruh tabel wajib memiliki index sesuai kebutuhan query.

---

## Primary Index

```text
PK(id)
```

---

## Unique Index

```text
UK(invoice_no)

UK(medical_record_no)

UK(username)

UK(item_code)
```

---

## Secondary Index

```text
IDX(patient_id)

IDX(doctor_id)

IDX(branch_id)

IDX(status)

IDX(created_at)
```

---

## Composite Index

Contoh:

```text
IDX(patient_id, visit_date)

IDX(branch_id, invoice_date)

IDX(item_id, warehouse_id)

IDX(doctor_id, reservation_date)
```

---

# 56. Data Archiving Strategy

Untuk menjaga performa database, data lama dapat dipindahkan ke tabel arsip.

Contoh:

```text
visits
↓

visits_archive
```

```text
invoices
↓

invoices_archive
```

```text
audit_logs
↓

audit_logs_archive
```

Data arsip tetap dapat diakses melalui modul Reporting apabila diperlukan.

---

# 57. Backup & Recovery Strategy

## Backup

- Full Backup Harian
- Incremental Backup setiap jam
- Binary Log Backup
- Offsite Backup
- Encrypted Backup

---

## Recovery

Target Recovery:

| Item | Target |
|------|---------|
| RPO | ≤ 15 menit |
| RTO | ≤ 1 jam |

---

# 58. Database Security

## Authentication

- Database User terpisah
- Least Privilege
- Password Rotation

---

## Encryption

- TLS Connection
- Password Hash (bcrypt)
- Sensitive Data Encryption
- Backup Encryption

---

## Audit

Seluruh perubahan penting wajib tercatat pada:

- audit_logs
- activity_logs

---

# 59. Future Database Evolution

Database telah dipersiapkan untuk mendukung:

- Multi Branch
- Multi Company
- Multi Warehouse
- Insurance Integration
- BPJS Integration
- Payment Gateway
- WhatsApp Integration
- AI Reporting
- Read Replica
- Database Sharding
- Microservices Migration
- Event Driven Architecture

---

# 60. Complete Database Relationship

```text
Authentication
        │
        ▼
Users
        │
        ▼
Patient
        │
        ▼
Reservation
        │
        ▼
Queue
        │
        ▼
Visit (EMR)
        │
        ├──────────────┐
        │              │
        ▼              ▼
Treatment      Prescription
        │              │
        └──────┬───────┘
               ▼
           Billing
               │
        ┌──────┴────────┐
        ▼               ▼
   Finance        Warehouse
        │               │
        └──────┬────────┘
               ▼
           Reporting
```

---

# 61. Summary

Dokumen **06 - Database Design** mendefinisikan desain database lengkap untuk seluruh sistem **Parakita** berdasarkan prinsip **Domain Driven Design (DDD)**, **Clean Architecture**, dan **Modular Monolith**.

Struktur database dibagi ke dalam bounded context sehingga setiap domain memiliki kepemilikan data yang jelas, mudah dipelihara, dan siap dikembangkan menuju arsitektur yang lebih besar.

## Database Modules

| Module | Estimated Tables |
|---------|----------------:|
| Authentication & System | 12 |
| Master Data | 20 |
| Patient | 8 |
| Reservation | 6 |
| Queue | 4 |
| EMR | 18 |
| Billing | 10 |
| Finance | 12 |
| Warehouse | 15 |
| Human Resource | 12 |
| Shared Module | 8 |
| **Total** | **±125 Tables** |

---

## Design Principles

Seluruh desain database mengikuti prinsip berikut:

- Domain Driven Design (DDD)
- Clean Architecture
- Modular Monolith
- Third Normal Form (3NF)
- UUID Primary Key
- Foreign Key Integrity
- Soft Delete
- Audit Trail
- UTC Timestamp
- Optimized Indexing
- ACID Transaction
- Future Multi Branch Ready

---

## Next Document

Tahapan berikutnya adalah penyusunan dokumen:

```text
07-api-specification.md
```

Dokumen tersebut akan mendefinisikan seluruh REST API yang digunakan oleh frontend dan integrasi eksternal, termasuk endpoint, request/response schema, autentikasi, authorization, error handling, pagination, filtering, versioning, serta standar kontrak API untuk seluruh modul pada sistem Parakita.

---
**End of Document**