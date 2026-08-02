# Parakita Software Architecture Document (SAD)

# 07 - Data Dictionary

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 07 - Data Dictionary |
| Part | 1 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Documentation |
| Database | MySQL |
| Last Updated | July 2026 |

---

# Table of Contents (Part 1)

1. Introduction
2. Purpose
3. Scope
4. Naming Convention
5. Common Columns Standard
6. Audit Columns
7. Soft Delete Strategy
8. Master Tables
   - clinic
   - branch
   - role
   - permission
   - role_permission
   - user
   - user_branch
9. Summary Part 1

---

# 1. Introduction

## 1.1 Overview

Dokumen **Data Dictionary** merupakan referensi resmi seluruh struktur data pada sistem **Parakita**.

Dokumen ini menjelaskan setiap tabel, kolom, tipe data, constraint, relasi, serta deskripsi bisnis sehingga seluruh tim pengembang memiliki pemahaman yang konsisten mengenai model data aplikasi.

Dokumen ini disusun berdasarkan desain database pada **06-database-design.md** dan menjadi acuan implementasi database, ORM (Prisma), API, reporting, serta integrasi antar modul.

---

## 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menjelaskan fungsi setiap tabel.
- Menjelaskan arti setiap field.
- Menentukan tipe data yang digunakan.
- Menentukan constraint database.
- Menjadi referensi Backend Developer.
- Menjadi referensi Frontend Developer.
- Menjadi referensi QA Engineer.
- Menjadi referensi Data Analyst.
- Menjadi acuan pengembangan fitur baru.

---

# 2. Purpose

Data Dictionary digunakan sebagai standar dokumentasi database agar:

- Tidak terjadi perbedaan interpretasi field.
- Mempermudah pengembangan fitur baru.
- Mempermudah integrasi antar modul.
- Mempermudah proses maintenance.
- Mempermudah pembuatan laporan.
- Menjadi referensi saat migrasi database.
- Menjadi referensi implementasi ORM.

---

# 3. Scope

Dokumen ini mencakup seluruh tabel pada sistem Parakita, meliputi:

- Authentication
- Master Data
- Patient
- Reservation
- Queue
- Electronic Medical Record (EMR)
- Billing
- Finance
- Warehouse
- Human Resource
- Reporting
- System Administration

---

# 4. Naming Convention

## 4.1 Table Naming

Seluruh nama tabel menggunakan:

- lowercase
- snake_case
- singular (bentuk tunggal)

Contoh:

```text
patient
reservation
visit
invoice
payment
employee
```

---

## 4.2 Column Naming

Seluruh nama kolom menggunakan snake_case.

Contoh:

```text
patient_code
medical_record_number
created_at
updated_at
deleted_at
```

---

## 4.3 Primary Key

Seluruh tabel menggunakan field:

```text
id
```

Tipe data:

```sql
CHAR(36)
```

Primary Key menggunakan UUID.

---

## 4.4 Foreign Key

Penamaan Foreign Key mengikuti nama tabel induk.

Contoh:

```text
patient_id
doctor_id
reservation_id
visit_id
invoice_id
branch_id
employee_id
```

---

## 4.5 Boolean Naming

Field boolean menggunakan awalan:

```text
is_
has_
```

Contoh:

```text
is_active
is_default
is_verified
has_attachment
```

---

## 4.6 Date & Time Naming

Standar penamaan waktu:

| Suffix | Description |
|---------|-------------|
| _date | Hanya tanggal |
| _time | Hanya waktu |
| _at | DateTime |

Contoh:

```text
birth_date
queue_time
created_at
updated_at
paid_at
deleted_at
```

---

# 5. Common Columns Standard

Seluruh tabel transaksi menggunakan standar berikut.

| Column | Type | Null | Description |
|---------|------|------|-------------|
| id | CHAR(36) | No | Primary Key (UUID) |
| created_at | DATETIME | No | Waktu pembuatan data |
| created_by | CHAR(36) | No | User pembuat |
| updated_at | DATETIME | No | Waktu perubahan terakhir |
| updated_by | CHAR(36) | Yes | User terakhir yang mengubah |
| deleted_at | DATETIME | Yes | Soft Delete Timestamp |
| deleted_by | CHAR(36) | Yes | User yang menghapus |
| is_active | BOOLEAN | No | Status aktif data |

---

# 6. Audit Columns

Seluruh tabel operasional wajib memiliki kolom audit.

| Column | Description |
|----------|---------------------------|
| created_at | Waktu data dibuat |
| created_by | Pengguna pembuat |
| updated_at | Waktu perubahan terakhir |
| updated_by | Pengguna terakhir yang mengubah |
| deleted_at | Waktu soft delete |
| deleted_by | Pengguna yang melakukan soft delete |

## Audit Principles

- Seluruh perubahan data dapat ditelusuri.
- User yang melakukan perubahan harus tercatat.
- Timestamp menggunakan zona waktu aplikasi.
- Soft delete tidak menghapus data secara fisik.

---

# 7. Soft Delete Strategy

Parakita menggunakan mekanisme **Soft Delete**.

Data tidak dihapus secara permanen.

Record dianggap aktif apabila:

```sql
deleted_at IS NULL
```

Record dianggap terhapus apabila:

```sql
deleted_at IS NOT NULL
```

Keuntungan Soft Delete:

- Audit lebih lengkap.
- Riwayat data tetap tersedia.
- Mengurangi risiko kehilangan data.
- Mempermudah proses restore.

---

# 8. Master Tables

---

# 8.1 Table : clinic

## Description

Menyimpan informasi organisasi atau perusahaan pemilik klinik.

### Primary Key

`id`

### Foreign Key

Tidak ada.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| clinic_code | VARCHAR(20) | No | UK | Kode Klinik |
| clinic_name | VARCHAR(150) | No | | Nama Klinik |
| owner_name | VARCHAR(150) | Yes | | Nama Pemilik |
| phone | VARCHAR(30) | Yes | | Nomor Telepon |
| email | VARCHAR(100) | Yes | | Email |
| address | TEXT | Yes | | Alamat |
| created_at | DATETIME | No | | Audit |
| updated_at | DATETIME | No | | Audit |

---

# 8.2 Table : branch

## Description

Menyimpan data cabang klinik.

### Primary Key

`id`

### Foreign Key

- clinic_id → clinic.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| clinic_id | CHAR(36) | No | FK | Klinik |
| branch_code | VARCHAR(20) | No | UK | Kode Cabang |
| branch_name | VARCHAR(150) | No | | Nama Cabang |
| phone | VARCHAR(30) | Yes | | Telepon |
| email | VARCHAR(100) | Yes | | Email |
| address | TEXT | Yes | | Alamat |
| timezone | VARCHAR(50) | No | | Zona Waktu |
| created_at | DATETIME | No | | Audit |
| updated_at | DATETIME | No | | Audit |

---

# 8.3 Table : role

## Description

Master Role yang digunakan pada sistem Role Based Access Control (RBAC).

### Primary Key

`id`

### Foreign Key

Tidak ada.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| role_code | VARCHAR(30) | No | UK | Kode Role |
| role_name | VARCHAR(100) | No | | Nama Role |
| description | TEXT | Yes | | Deskripsi |
| is_system | BOOLEAN | No | | Role bawaan sistem |

---

# 8.4 Table : permission

## Description

Daftar permission yang dapat diberikan kepada Role.

### Primary Key

`id`

### Foreign Key

Tidak ada.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| permission_code | VARCHAR(100) | No | UK | Kode Permission |
| module | VARCHAR(50) | No | | Nama Modul |
| action | VARCHAR(50) | No | | Read, Create, Update, Delete, Approve, Print, Export |
| description | TEXT | Yes | | Deskripsi |

---

# 8.5 Table : role_permission

## Description

Mapping many-to-many antara Role dan Permission.

### Primary Key

`id`

### Foreign Key

- role_id → role.id
- permission_id → permission.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| role_id | CHAR(36) | No | FK | Role |
| permission_id | CHAR(36) | No | FK | Permission |

---

# 8.6 Table : user

## Description

Menyimpan akun pengguna sistem.

### Primary Key

`id`

### Foreign Key

- role_id → role.id
- employee_id → employee.id (nullable)

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| username | VARCHAR(100) | No | UK | Username Login |
| email | VARCHAR(150) | Yes | UK | Email |
| password_hash | VARCHAR(255) | No | | Password Hash |
| full_name | VARCHAR(150) | No | | Nama Lengkap |
| role_id | CHAR(36) | No | FK | Role |
| employee_id | CHAR(36) | Yes | FK | Relasi Employee |
| is_active | BOOLEAN | No | | Status Aktif |
| last_login_at | DATETIME | Yes | | Login Terakhir |
| created_at | DATETIME | No | | Audit |
| updated_at | DATETIME | No | | Audit |

---

# 8.7 Table : user_branch

## Description

Mapping User dengan cabang yang dapat diakses.

### Primary Key

`id`

### Foreign Key

- user_id → user.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| user_id | CHAR(36) | No | FK | User |
| branch_id | CHAR(36) | No | FK | Branch |
| is_default | BOOLEAN | No | | Cabang Default |

---

# Summary Part 1

Part 1 mendefinisikan standar dokumentasi database yang digunakan pada sistem Parakita, meliputi konvensi penamaan, standar kolom umum, audit trail, strategi soft delete, serta data dictionary untuk tabel-tabel master utama yaitu **clinic**, **branch**, **role**, **permission**, **role_permission**, **user**, dan **user_branch**.

Dokumen ini menjadi fondasi bagi bagian-bagian selanjutnya yang akan mendokumentasikan tabel pada modul **Master Data**, **Patient**, **Reservation**, **Queue**, **EMR**, **Billing**, **Finance**, **Warehouse**, **Human Resource**, dan **Reporting**.

# Parakita Software Architecture Document (SAD)

# 07 - Data Dictionary

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 07 - Data Dictionary |
| Part | 2 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Documentation |
| Database | MySQL |
| Last Updated | July 2026 |

---

# Table of Contents (Part 2)

10. Master Data Tables
- gender
- religion
- occupation
- education
- marital_status
- blood_type
- patient_group
- insurance
- specialization
- department
- room
- chair
- treatment_category
- treatment
- odontogram_condition
- diagnosis
- medicine
- inventory_category
- inventory_item
- supplier

11. Summary Part 2

---

# 10. Master Data Tables

Master Data merupakan referensi yang digunakan oleh seluruh modul sistem. Data pada tabel ini relatif jarang berubah dan digunakan sebagai Foreign Key oleh tabel transaksi.

---

# 10.1 Table : gender

## Description

Master jenis kelamin pasien dan karyawan.

### Primary Key

`id`

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| gender_code | VARCHAR(10) | No | UK | Kode Gender |
| gender_name | VARCHAR(50) | No | | Nama Gender |
| display_order | INT | No | | Urutan Tampilan |
| is_active | BOOLEAN | No | | Status Aktif |

---

# 10.2 Table : religion

## Description

Master agama.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| religion_code | VARCHAR(20) | No | UK | Kode Agama |
| religion_name | VARCHAR(100) | No | | Nama Agama |
| is_active | BOOLEAN | No | | Status Aktif |

---

# 10.3 Table : occupation

## Description

Master pekerjaan pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| occupation_code | VARCHAR(30) | No | UK | Kode |
| occupation_name | VARCHAR(150) | No | | Nama Pekerjaan |
| is_active | BOOLEAN | No | | Status |

---

# 10.4 Table : education

## Description

Master tingkat pendidikan.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| education_code | VARCHAR(30) | No | UK | Kode |
| education_name | VARCHAR(150) | No | | Nama Pendidikan |
| level_order | INT | No | | Urutan |
| is_active | BOOLEAN | No | | Status |

---

# 10.5 Table : marital_status

## Description

Master status pernikahan.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| marital_status_code | VARCHAR(30) | No | UK | Kode |
| marital_status_name | VARCHAR(100) | No | | Nama Status |
| is_active | BOOLEAN | No | | Status |

---

# 10.6 Table : blood_type

## Description

Master golongan darah.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| blood_type_code | VARCHAR(5) | No | UK | Kode |
| blood_type_name | VARCHAR(10) | No | | Nama Golongan |
| rhesus | CHAR(1) | Yes | | Faktor Rhesus |
| is_active | BOOLEAN | No | | Status |

---

# 10.7 Table : patient_group

## Description

Kelompok pasien berdasarkan kategori layanan.

Contoh:

- Umum
- BPJS
- Asuransi
- Corporate
- Member

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| group_code | VARCHAR(30) | No | UK | Kode Group |
| group_name | VARCHAR(100) | No | | Nama Group |
| description | TEXT | Yes | | Keterangan |
| is_active | BOOLEAN | No | | Status |

---

# 10.8 Table : insurance

## Description

Master perusahaan asuransi.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| insurance_code | VARCHAR(30) | No | UK | Kode |
| insurance_name | VARCHAR(150) | No | | Nama Asuransi |
| contact_person | VARCHAR(150) | Yes | | PIC |
| phone | VARCHAR(30) | Yes | | Telepon |
| email | VARCHAR(100) | Yes | | Email |
| is_active | BOOLEAN | No | | Status |

---

# 10.9 Table : specialization

## Description

Master spesialisasi dokter.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| specialization_code | VARCHAR(30) | No | UK | Kode |
| specialization_name | VARCHAR(100) | No | | Nama Spesialisasi |
| is_active | BOOLEAN | No | | Status |

---

# 10.10 Table : department

## Description

Master departemen klinik.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| department_code | VARCHAR(30) | No | UK | Kode |
| department_name | VARCHAR(100) | No | | Nama Departemen |
| description | TEXT | Yes | | Keterangan |
| is_active | BOOLEAN | No | | Status |

---

# 10.11 Table : room

## Description

Master ruang pelayanan.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| room_code | VARCHAR(20) | No | UK | Kode |
| room_name | VARCHAR(100) | No | | Nama Ruangan |
| department_id | CHAR(36) | No | FK | Departemen |
| floor | VARCHAR(20) | Yes | | Lantai |
| is_active | BOOLEAN | No | | Status |

---

# 10.12 Table : chair

## Description

Master dental chair.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| chair_code | VARCHAR(20) | No | UK | Kode Chair |
| chair_name | VARCHAR(100) | No | | Nama Chair |
| room_id | CHAR(36) | No | FK | Ruangan |
| status | VARCHAR(20) | No | | Ready / Maintenance |
| is_active | BOOLEAN | No | | Status |

---

# 10.13 Table : treatment_category

## Description

Kategori tindakan medis.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| category_code | VARCHAR(30) | No | UK | Kode |
| category_name | VARCHAR(100) | No | | Nama Kategori |
| is_active | BOOLEAN | No | | Status |

---

# 10.14 Table : treatment

## Description

Master tindakan medis.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| treatment_code | VARCHAR(30) | No | UK | Kode |
| treatment_name | VARCHAR(200) | No | | Nama Tindakan |
| treatment_category_id | CHAR(36) | No | FK | Kategori |
| duration_minute | INT | Yes | | Estimasi Durasi |
| default_price | DECIMAL(18,2) | No | | Harga Default |
| doctor_fee | DECIMAL(18,2) | Yes | | Jasa Dokter |
| is_active | BOOLEAN | No | | Status |

---

# 10.15 Table : odontogram_condition

## Description

Master kondisi gigi pada odontogram.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| condition_code | VARCHAR(30) | No | UK | Kode |
| condition_name | VARCHAR(150) | No | | Nama Kondisi |
| color_code | VARCHAR(20) | Yes | | Warna Tampilan |
| description | TEXT | Yes | | Deskripsi |

---

# 10.16 Table : diagnosis

## Description

Master diagnosis (ICD atau internal clinic code).

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| diagnosis_code | VARCHAR(30) | No | UK | Kode Diagnosis |
| diagnosis_name | VARCHAR(255) | No | | Nama Diagnosis |
| description | TEXT | Yes | | Deskripsi |
| is_active | BOOLEAN | No | | Status |

---

# 10.17 Table : medicine

## Description

Master obat.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| medicine_code | VARCHAR(30) | No | UK | Kode |
| medicine_name | VARCHAR(200) | No | | Nama Obat |
| unit | VARCHAR(30) | No | | Satuan |
| selling_price | DECIMAL(18,2) | No | | Harga Jual |
| stock_alert | INT | Yes | | Minimum Stock |
| is_active | BOOLEAN | No | | Status |

---

# 10.18 Table : inventory_category

## Description

Kategori barang inventory.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| category_code | VARCHAR(30) | No | UK | Kode |
| category_name | VARCHAR(100) | No | | Nama Kategori |
| is_active | BOOLEAN | No | | Status |

---

# 10.19 Table : inventory_item

## Description

Master barang inventory klinik.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| item_code | VARCHAR(30) | No | UK | Kode Barang |
| item_name | VARCHAR(200) | No | | Nama Barang |
| inventory_category_id | CHAR(36) | No | FK | Kategori |
| unit | VARCHAR(30) | No | | Satuan |
| minimum_stock | DECIMAL(18,2) | No | | Minimum Stock |
| is_consumable | BOOLEAN | No | | Barang Habis Pakai |
| is_active | BOOLEAN | No | | Status |

---

# 10.20 Table : supplier

## Description

Master supplier barang dan obat.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| supplier_code | VARCHAR(30) | No | UK | Kode Supplier |
| supplier_name | VARCHAR(200) | No | | Nama Supplier |
| contact_person | VARCHAR(150) | Yes | | PIC |
| phone | VARCHAR(30) | Yes | | Telepon |
| email | VARCHAR(100) | Yes | | Email |
| address | TEXT | Yes | | Alamat |
| is_active | BOOLEAN | No | | Status |

---

# Summary Part 2

Part 2 mendokumentasikan seluruh **Master Data** yang menjadi referensi utama bagi modul-modul transaksi pada sistem Parakita. Tabel-tabel master ini mencakup referensi identitas pasien, organisasi klinik, layanan medis, diagnosis, obat, inventori, supplier, hingga konfigurasi operasional yang digunakan secara konsisten oleh modul **Patient**, **Reservation**, **EMR**, **Billing**, **Warehouse**, dan **Human Resource**.

# Parakita Software Architecture Document (SAD)

# 07 - Data Dictionary

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 07 - Data Dictionary |
| Part | 3 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Documentation |
| Database | MySQL |
| Last Updated | July 2026 |

---

# Table of Contents (Part 3)

12. Patient Module
- patient
- patient_identity
- patient_contact
- patient_address
- patient_emergency_contact
- patient_insurance
- patient_allergy
- patient_medical_history
- patient_document

13. Reservation & Queue Module
- reservation
- reservation_service
- queue
- queue_history

14. Summary Part 3

---

# 12. Patient Module

Modul Patient merupakan pusat seluruh informasi pasien yang digunakan oleh modul Reservation, EMR, Billing, Finance, dan Reporting.

---

# 12.1 Table : patient

## Description

Menyimpan data utama pasien.

### Primary Key

`id`

### Foreign Key

- gender_id → gender.id
- religion_id → religion.id
- occupation_id → occupation.id
- education_id → education.id
- marital_status_id → marital_status.id
- blood_type_id → blood_type.id
- patient_group_id → patient_group.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_code | VARCHAR(30) | No | UK | Nomor Pasien |
| medical_record_number | VARCHAR(30) | No | UK | Nomor Rekam Medis |
| national_id | VARCHAR(30) | Yes | | Nomor KTP |
| full_name | VARCHAR(200) | No | | Nama Lengkap |
| nickname | VARCHAR(100) | Yes | | Nama Panggilan |
| gender_id | CHAR(36) | No | FK | Jenis Kelamin |
| birth_place | VARCHAR(100) | Yes | | Tempat Lahir |
| birth_date | DATE | No | | Tanggal Lahir |
| religion_id | CHAR(36) | Yes | FK | Agama |
| occupation_id | CHAR(36) | Yes | FK | Pekerjaan |
| education_id | CHAR(36) | Yes | FK | Pendidikan |
| marital_status_id | CHAR(36) | Yes | FK | Status Pernikahan |
| blood_type_id | CHAR(36) | Yes | FK | Golongan Darah |
| patient_group_id | CHAR(36) | No | FK | Kelompok Pasien |
| email | VARCHAR(150) | Yes | | Email |
| phone | VARCHAR(30) | Yes | | Nomor HP |
| is_active | BOOLEAN | No | | Status |

---

# 12.2 Table : patient_identity

## Description

Dokumen identitas tambahan pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| identity_type | VARCHAR(30) | No | | KTP/Paspor/SIM |
| identity_number | VARCHAR(100) | No | | Nomor Identitas |
| issued_date | DATE | Yes | | Tanggal Terbit |
| expired_date | DATE | Yes | | Berlaku Hingga |

---

# 12.3 Table : patient_contact

## Description

Nomor kontak pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| contact_type | VARCHAR(30) | No | | Mobile/Home/Office |
| contact_value | VARCHAR(100) | No | | Nomor Kontak |
| is_primary | BOOLEAN | No | | Kontak Utama |

---

# 12.4 Table : patient_address

## Description

Alamat pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| address | TEXT | No | | Alamat |
| city | VARCHAR(100) | No | | Kota |
| province | VARCHAR(100) | No | | Provinsi |
| postal_code | VARCHAR(10) | Yes | | Kode Pos |
| is_primary | BOOLEAN | No | | Alamat Utama |

---

# 12.5 Table : patient_emergency_contact

## Description

Kontak darurat pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| contact_name | VARCHAR(150) | No | | Nama |
| relationship | VARCHAR(100) | No | | Hubungan |
| phone | VARCHAR(30) | No | | Nomor HP |
| address | TEXT | Yes | | Alamat |

---

# 12.6 Table : patient_insurance

## Description

Asuransi yang dimiliki pasien.

### Foreign Key

- patient_id → patient.id
- insurance_id → insurance.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| insurance_id | CHAR(36) | No | FK | Asuransi |
| policy_number | VARCHAR(100) | No | | Nomor Polis |
| member_number | VARCHAR(100) | Yes | | Nomor Member |
| valid_until | DATE | Yes | | Masa Berlaku |
| is_primary | BOOLEAN | No | | Asuransi Utama |

---

# 12.7 Table : patient_allergy

## Description

Riwayat alergi pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| allergy_type | VARCHAR(50) | No | | Obat/Makanan/Lainnya |
| allergy_name | VARCHAR(150) | No | | Nama Alergi |
| severity | VARCHAR(30) | Yes | | Tingkat Keparahan |
| notes | TEXT | Yes | | Catatan |

---

# 12.8 Table : patient_medical_history

## Description

Riwayat penyakit pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| disease_name | VARCHAR(200) | No | | Nama Penyakit |
| diagnosed_date | DATE | Yes | | Tanggal Diagnosis |
| status | VARCHAR(50) | Yes | | Aktif/Sembuh |
| notes | TEXT | Yes | | Catatan |

---

# 12.9 Table : patient_document

## Description

Dokumen digital pasien.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| patient_id | CHAR(36) | No | FK | Pasien |
| document_type | VARCHAR(50) | No | | Jenis Dokumen |
| file_name | VARCHAR(255) | No | | Nama File |
| file_path | VARCHAR(500) | No | | Lokasi File |
| uploaded_at | DATETIME | No | | Waktu Upload |

---

# 13. Reservation & Queue Module

Modul ini mengelola proses reservasi pasien hingga antrean pelayanan.

---

# 13.1 Table : reservation

## Description

Data reservasi pasien.

### Foreign Key

- patient_id → patient.id
- doctor_id → employee.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| reservation_number | VARCHAR(30) | No | UK | Nomor Reservasi |
| reservation_date | DATE | No | | Tanggal Reservasi |
| reservation_time | TIME | No | | Jam Reservasi |
| patient_id | CHAR(36) | No | FK | Pasien |
| doctor_id | CHAR(36) | No | FK | Dokter |
| branch_id | CHAR(36) | No | FK | Cabang |
| status | VARCHAR(30) | No | | Scheduled/Checked-In/Completed/Cancelled |
| notes | TEXT | Yes | | Catatan |

---

# 13.2 Table : reservation_service

## Description

Daftar layanan yang dipesan pada reservasi.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| reservation_id | CHAR(36) | No | FK | Reservasi |
| treatment_id | CHAR(36) | No | FK | Tindakan |
| estimated_duration | INT | Yes | | Durasi |
| estimated_price | DECIMAL(18,2) | Yes | | Estimasi Harga |

---

# 13.3 Table : queue

## Description

Data antrean pelayanan.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| reservation_id | CHAR(36) | No | FK | Reservasi |
| queue_number | VARCHAR(20) | No | | Nomor Antrean |
| queue_date | DATE | No | | Tanggal |
| called_at | DATETIME | Yes | | Dipanggil |
| started_at | DATETIME | Yes | | Mulai Dilayani |
| finished_at | DATETIME | Yes | | Selesai |
| status | VARCHAR(30) | No | | Waiting/Serving/Completed/Skipped |

---

# 13.4 Table : queue_history

## Description

Riwayat perubahan status antrean.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| queue_id | CHAR(36) | No | FK | Queue |
| previous_status | VARCHAR(30) | No | | Status Sebelumnya |
| current_status | VARCHAR(30) | No | | Status Baru |
| changed_at | DATETIME | No | | Waktu Perubahan |
| changed_by | CHAR(36) | No | FK | User |

---

# Summary Part 3

Part 3 mendokumentasikan struktur tabel untuk **Patient Module** serta **Reservation & Queue Module**. Bagian ini mencakup seluruh informasi identitas pasien, kontak, riwayat kesehatan, asuransi, dokumen digital, reservasi layanan, hingga proses antrean pasien. Struktur data ini menjadi fondasi operasional bagi modul **Electronic Medical Record (EMR)**, **Billing**, **Finance**, dan **Reporting**.


# Parakita Software Architecture Document (SAD)

# 07 - Data Dictionary

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 07 - Data Dictionary |
| Part | 4 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Documentation |
| Database | MySQL |
| Last Updated | July 2026 |

---

# Table of Contents (Part 4)

15. Electronic Medical Record (EMR)
- visit
- odontogram
- treatment_record
- diagnosis_record
- prescription
- prescription_item
- medical_attachment

16. Billing & Finance
- invoice
- invoice_item
- payment
- payment_allocation
- payment_method
- expense
- expense_category

17. Summary Part 4

---

# 15. Electronic Medical Record (EMR)

Modul EMR menyimpan seluruh aktivitas pemeriksaan, diagnosis, tindakan medis, odontogram, resep obat, serta dokumen medis pasien.

---

# 15.1 Table : visit

## Description

Data kunjungan pasien.

### Foreign Key

- reservation_id → reservation.id
- patient_id → patient.id
- doctor_id → employee.id
- room_id → room.id
- chair_id → chair.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| visit_number | VARCHAR(30) | No | UK | Nomor Kunjungan |
| reservation_id | CHAR(36) | Yes | FK | Reservasi |
| patient_id | CHAR(36) | No | FK | Pasien |
| doctor_id | CHAR(36) | No | FK | Dokter |
| room_id | CHAR(36) | Yes | FK | Ruangan |
| chair_id | CHAR(36) | Yes | FK | Dental Chair |
| visit_date | DATETIME | No | | Waktu Kunjungan |
| chief_complaint | TEXT | Yes | | Keluhan Utama |
| medical_notes | LONGTEXT | Yes | | Catatan Dokter |
| status | VARCHAR(30) | No | | Open / Completed / Cancelled |

---

# 15.2 Table : odontogram

## Description

Menyimpan kondisi setiap gigi pasien.

### Foreign Key

- visit_id → visit.id
- patient_id → patient.id
- condition_id → odontogram_condition.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| patient_id | CHAR(36) | No | FK | Pasien |
| tooth_number | VARCHAR(10) | No | | Nomor Gigi (FDI) |
| condition_id | CHAR(36) | No | FK | Kondisi |
| notes | TEXT | Yes | | Catatan |

---

# 15.3 Table : treatment_record

## Description

Daftar tindakan yang dilakukan pada kunjungan.

### Foreign Key

- visit_id → visit.id
- treatment_id → treatment.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| treatment_id | CHAR(36) | No | FK | Tindakan |
| tooth_number | VARCHAR(10) | Yes | | Gigi yang dirawat |
| quantity | INT | No | | Jumlah |
| price | DECIMAL(18,2) | No | | Harga |
| doctor_fee | DECIMAL(18,2) | Yes | | Jasa Dokter |
| notes | TEXT | Yes | | Catatan |

---

# 15.4 Table : diagnosis_record

## Description

Diagnosis hasil pemeriksaan pasien.

### Foreign Key

- visit_id → visit.id
- diagnosis_id → diagnosis.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| diagnosis_id | CHAR(36) | No | FK | Master Diagnosis |
| diagnosis_type | VARCHAR(30) | No | | Primary / Secondary |
| notes | TEXT | Yes | | Catatan |

---

# 15.5 Table : prescription

## Description

Header resep obat.

### Foreign Key

- visit_id → visit.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| prescription_number | VARCHAR(30) | No | UK | Nomor Resep |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| prescribed_at | DATETIME | No | | Waktu Resep |
| notes | TEXT | Yes | | Catatan |

---

# 15.6 Table : prescription_item

## Description

Detail obat dalam resep.

### Foreign Key

- prescription_id → prescription.id
- medicine_id → medicine.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| prescription_id | CHAR(36) | No | FK | Resep |
| medicine_id | CHAR(36) | No | FK | Obat |
| dosage | VARCHAR(100) | No | | Dosis |
| frequency | VARCHAR(100) | No | | Frekuensi |
| duration_day | INT | Yes | | Lama Penggunaan |
| quantity | DECIMAL(18,2) | No | | Jumlah |
| notes | TEXT | Yes | | Catatan |

---

# 15.7 Table : medical_attachment

## Description

Dokumen pendukung rekam medis.

### Foreign Key

- visit_id → visit.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| attachment_type | VARCHAR(50) | No | | Foto/Rontgen/PDF |
| file_name | VARCHAR(255) | No | | Nama File |
| file_path | VARCHAR(500) | No | | Lokasi File |
| uploaded_at | DATETIME | No | | Waktu Upload |

---

# 16. Billing & Finance

Modul Billing dan Finance mengelola tagihan pasien, pembayaran, alokasi pembayaran, serta pencatatan pengeluaran operasional.

---

# 16.1 Table : invoice

## Description

Header tagihan pasien.

### Foreign Key

- visit_id → visit.id
- patient_id → patient.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| invoice_number | VARCHAR(30) | No | UK | Nomor Invoice |
| visit_id | CHAR(36) | No | FK | Kunjungan |
| patient_id | CHAR(36) | No | FK | Pasien |
| invoice_date | DATETIME | No | | Tanggal Invoice |
| subtotal | DECIMAL(18,2) | No | | Total Sebelum Diskon |
| discount | DECIMAL(18,2) | No | | Diskon |
| tax | DECIMAL(18,2) | No | | Pajak |
| grand_total | DECIMAL(18,2) | No | | Total Akhir |
| status | VARCHAR(30) | No | | Draft/Paid/Partial/Void |

---

# 16.2 Table : invoice_item

## Description

Detail item tagihan.

### Foreign Key

- invoice_id → invoice.id
- treatment_record_id → treatment_record.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| invoice_id | CHAR(36) | No | FK | Invoice |
| treatment_record_id | CHAR(36) | Yes | FK | Tindakan |
| description | VARCHAR(255) | No | | Nama Item |
| quantity | DECIMAL(18,2) | No | | Qty |
| unit_price | DECIMAL(18,2) | No | | Harga |
| discount | DECIMAL(18,2) | No | | Diskon |
| total | DECIMAL(18,2) | No | | Total |

---

# 16.3 Table : payment_method

## Description

Master metode pembayaran.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| method_code | VARCHAR(30) | No | UK | Kode |
| method_name | VARCHAR(100) | No | | Nama Metode |
| is_cash | BOOLEAN | No | | Tunai |
| is_active | BOOLEAN | No | | Status |

---

# 16.4 Table : payment

## Description

Pembayaran invoice.

### Foreign Key

- invoice_id → invoice.id
- payment_method_id → payment_method.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| payment_number | VARCHAR(30) | No | UK | Nomor Pembayaran |
| invoice_id | CHAR(36) | No | FK | Invoice |
| payment_method_id | CHAR(36) | No | FK | Metode Pembayaran |
| payment_date | DATETIME | No | | Tanggal Bayar |
| amount | DECIMAL(18,2) | No | | Nilai Bayar |
| reference_number | VARCHAR(100) | Yes | | No Referensi |
| notes | TEXT | Yes | | Catatan |

---

# 16.5 Table : payment_allocation

## Description

Alokasi pembayaran apabila satu pembayaran digunakan untuk beberapa invoice atau beberapa komponen tagihan.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| payment_id | CHAR(36) | No | FK | Pembayaran |
| invoice_item_id | CHAR(36) | No | FK | Detail Invoice |
| allocated_amount | DECIMAL(18,2) | No | | Nominal Dialokasikan |

---

# 16.6 Table : expense_category

## Description

Kategori pengeluaran operasional.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| category_code | VARCHAR(30) | No | UK | Kode |
| category_name | VARCHAR(100) | No | | Nama Kategori |
| is_active | BOOLEAN | No | | Status |

---

# 16.7 Table : expense

## Description

Pengeluaran operasional klinik.

### Foreign Key

- expense_category_id → expense_category.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| expense_number | VARCHAR(30) | No | UK | Nomor Pengeluaran |
| expense_category_id | CHAR(36) | No | FK | Kategori |
| branch_id | CHAR(36) | No | FK | Cabang |
| expense_date | DATE | No | | Tanggal |
| description | VARCHAR(255) | No | | Deskripsi |
| amount | DECIMAL(18,2) | No | | Nominal |
| notes | TEXT | Yes | | Catatan |

---

# Summary Part 4

Part 4 mendokumentasikan struktur data untuk modul **Electronic Medical Record (EMR)** serta **Billing & Finance**. Tabel-tabel pada bagian ini mencakup seluruh proses klinis mulai dari kunjungan pasien, odontogram, diagnosis, tindakan medis, resep obat, hingga proses penagihan, pembayaran, dan pencatatan pengeluaran operasional. Modul-modul ini menjadi inti proses bisnis klinik dan terintegrasi secara langsung dengan **Patient**, **Reservation**, **Warehouse**, serta **Reporting**.

# Parakita Software Architecture Document (SAD)

# 07 - Data Dictionary

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 07 - Data Dictionary |
| Part | 5 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Database Documentation |
| Database | MySQL |
| Last Updated | July 2026 |

---

# Table of Contents (Part 5)

18. Human Resource Module
- employee
- employee_schedule
- attendance

19. Warehouse Module
- purchase_order
- purchase_order_item
- goods_receipt
- inventory_stock
- inventory_transaction
- stock_opname

20. System & Audit Module
- notification
- audit_log
- activity_log
- system_setting

21. Database Relationship Summary

22. Data Dictionary Standards

23. Summary Part 5

---

# 18. Human Resource Module

Modul Human Resource mengelola data pegawai, jadwal kerja, serta absensi yang digunakan oleh seluruh modul operasional.

---

# 18.1 Table : employee

## Description

Menyimpan data seluruh pegawai klinik.

### Primary Key

`id`

### Foreign Key

- department_id → department.id
- specialization_id → specialization.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| employee_code | VARCHAR(30) | No | UK | Kode Pegawai |
| full_name | VARCHAR(200) | No | | Nama Lengkap |
| department_id | CHAR(36) | No | FK | Departemen |
| specialization_id | CHAR(36) | Yes | FK | Spesialisasi |
| branch_id | CHAR(36) | No | FK | Cabang |
| hire_date | DATE | No | | Tanggal Masuk |
| employment_status | VARCHAR(30) | No | | Tetap/Kontrak |
| phone | VARCHAR(30) | Yes | | Nomor Telepon |
| email | VARCHAR(150) | Yes | | Email |
| is_active | BOOLEAN | No | | Status |

---

# 18.2 Table : employee_schedule

## Description

Jadwal kerja pegawai.

### Foreign Key

- employee_id → employee.id
- room_id → room.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| employee_id | CHAR(36) | No | FK | Pegawai |
| work_date | DATE | No | | Tanggal |
| start_time | TIME | No | | Jam Mulai |
| end_time | TIME | No | | Jam Selesai |
| room_id | CHAR(36) | Yes | FK | Ruangan |
| status | VARCHAR(30) | No | | Scheduled / Off / Leave |

---

# 18.3 Table : attendance

## Description

Absensi pegawai.

### Foreign Key

- employee_id → employee.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| employee_id | CHAR(36) | No | FK | Pegawai |
| attendance_date | DATE | No | | Tanggal |
| check_in | DATETIME | Yes | | Jam Masuk |
| check_out | DATETIME | Yes | | Jam Pulang |
| attendance_status | VARCHAR(30) | No | | Present / Leave / Sick |
| notes | TEXT | Yes | | Catatan |

---

# 19. Warehouse Module

Modul Warehouse mengelola proses pembelian, penerimaan barang, stok, dan mutasi inventory.

---

# 19.1 Table : purchase_order

## Description

Header Purchase Order.

### Foreign Key

- supplier_id → supplier.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| po_number | VARCHAR(30) | No | UK | Nomor PO |
| supplier_id | CHAR(36) | No | FK | Supplier |
| branch_id | CHAR(36) | No | FK | Cabang |
| order_date | DATE | No | | Tanggal PO |
| expected_date | DATE | Yes | | Estimasi Datang |
| status | VARCHAR(30) | No | | Draft / Ordered / Received / Closed |

---

# 19.2 Table : purchase_order_item

## Description

Detail Purchase Order.

### Foreign Key

- purchase_order_id → purchase_order.id
- inventory_item_id → inventory_item.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| purchase_order_id | CHAR(36) | No | FK | Purchase Order |
| inventory_item_id | CHAR(36) | No | FK | Barang |
| quantity | DECIMAL(18,2) | No | | Jumlah |
| unit_price | DECIMAL(18,2) | No | | Harga |
| total | DECIMAL(18,2) | No | | Total |

---

# 19.3 Table : goods_receipt

## Description

Penerimaan barang dari supplier.

### Foreign Key

- purchase_order_id → purchase_order.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| receipt_number | VARCHAR(30) | No | UK | Nomor Penerimaan |
| purchase_order_id | CHAR(36) | No | FK | Purchase Order |
| receipt_date | DATE | No | | Tanggal Terima |
| received_by | CHAR(36) | No | FK | User |
| notes | TEXT | Yes | | Catatan |

---

# 19.4 Table : inventory_stock

## Description

Saldo stok barang per cabang.

### Foreign Key

- inventory_item_id → inventory_item.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| inventory_item_id | CHAR(36) | No | FK | Barang |
| branch_id | CHAR(36) | No | FK | Cabang |
| current_stock | DECIMAL(18,2) | No | | Saldo |
| minimum_stock | DECIMAL(18,2) | No | | Minimum Stock |
| last_updated | DATETIME | No | | Update Terakhir |

---

# 19.5 Table : inventory_transaction

## Description

Riwayat mutasi stok.

### Foreign Key

- inventory_item_id → inventory_item.id
- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| transaction_number | VARCHAR(30) | No | UK | Nomor Transaksi |
| inventory_item_id | CHAR(36) | No | FK | Barang |
| branch_id | CHAR(36) | No | FK | Cabang |
| transaction_type | VARCHAR(30) | No | | IN / OUT / ADJUSTMENT |
| quantity | DECIMAL(18,2) | No | | Qty |
| reference_number | VARCHAR(50) | Yes | | Referensi |
| transaction_date | DATETIME | No | | Waktu |

---

# 19.6 Table : stock_opname

## Description

Hasil stock opname.

### Foreign Key

- branch_id → branch.id

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| opname_number | VARCHAR(30) | No | UK | Nomor Opname |
| branch_id | CHAR(36) | No | FK | Cabang |
| opname_date | DATE | No | | Tanggal |
| status | VARCHAR(30) | No | | Draft / Approved |
| notes | TEXT | Yes | | Catatan |

---

# 20. System & Audit Module

Modul ini menyimpan konfigurasi sistem, aktivitas pengguna, audit trail, dan notifikasi.

---

# 20.1 Table : notification

## Description

Notifikasi sistem kepada pengguna.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| user_id | CHAR(36) | No | FK | User |
| title | VARCHAR(200) | No | | Judul |
| message | TEXT | No | | Isi Notifikasi |
| notification_type | VARCHAR(30) | No | | Info / Warning / Reminder |
| is_read | BOOLEAN | No | | Sudah Dibaca |
| created_at | DATETIME | No | | Waktu Dibuat |

---

# 20.2 Table : audit_log

## Description

Audit trail perubahan data.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| table_name | VARCHAR(100) | No | | Nama Tabel |
| record_id | CHAR(36) | No | | Primary Key Record |
| action | VARCHAR(20) | No | | INSERT / UPDATE / DELETE |
| old_value | LONGTEXT | Yes | | Data Lama (JSON) |
| new_value | LONGTEXT | Yes | | Data Baru (JSON) |
| changed_by | CHAR(36) | No | FK | User |
| changed_at | DATETIME | No | | Waktu Perubahan |

---

# 20.3 Table : activity_log

## Description

Log aktivitas pengguna dalam aplikasi.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| user_id | CHAR(36) | No | FK | User |
| module | VARCHAR(100) | No | | Modul |
| activity | VARCHAR(255) | No | | Aktivitas |
| ip_address | VARCHAR(50) | Yes | | IP Address |
| user_agent | TEXT | Yes | | Browser |
| created_at | DATETIME | No | | Waktu Aktivitas |

---

# 20.4 Table : system_setting

## Description

Konfigurasi sistem.

| Column | Type | Null | Key | Description |
|---------|------|------|-----|-------------|
| id | CHAR(36) | No | PK | UUID |
| setting_key | VARCHAR(100) | No | UK | Key |
| setting_value | TEXT | Yes | | Value |
| description | VARCHAR(255) | Yes | | Deskripsi |
| is_public | BOOLEAN | No | | Dapat Diakses Client |

---

# 21. Database Relationship Summary

Hubungan utama antar modul pada sistem Parakita adalah sebagai berikut.

```text
Clinic
   │
Branch
   │
Employee ────────────────┐
   │                     │
Patient ── Reservation ─ Visit
                            │
        ┌───────────────────┼──────────────────┐
        │                   │                  │
  Odontogram         Treatment Record    Diagnosis
        │                   │                  │
        └──────────────┬────┴──────────────┐
                       │                   │
                  Prescription         Invoice
                       │                   │
                Prescription Item     Payment
```

Warehouse terhubung dengan:

- Purchase Order
- Goods Receipt
- Inventory Stock
- Inventory Transaction

Sedangkan modul System digunakan oleh seluruh modul melalui:

- User
- Audit Log
- Activity Log
- Notification

---

# 22. Data Dictionary Standards

Seluruh tabel pada Parakita mengikuti standar berikut.

| Standard | Description |
|-----------|-------------|
| Primary Key | UUID (CHAR(36)) |
| Foreign Key | Menggunakan UUID |
| Timestamp | DATETIME |
| Soft Delete | deleted_at & deleted_by |
| Audit Trail | created_by & updated_by |
| Boolean | is_active |
| Naming | snake_case |
| Table | singular |
| Currency | DECIMAL(18,2) |

---

# 23. Summary Part 5

Part 5 melengkapi dokumentasi **Data Dictionary** dengan mendefinisikan tabel pada modul **Human Resource**, **Warehouse**, **System Administration**, serta ringkasan relasi database secara keseluruhan.

Dengan selesainya dokumen ini, seluruh struktur database Parakita telah terdokumentasi secara lengkap, mencakup:

- Authentication & Authorization
- Master Data
- Patient Management
- Reservation & Queue
- Electronic Medical Record (EMR)
- Billing & Finance
- Warehouse & Inventory
- Human Resource
- System Administration
- Audit & Logging

Dokumen **07 - Data Dictionary** menjadi referensi utama bagi proses implementasi **Prisma Schema**, pengembangan **REST API**, penyusunan **ERD**, pembuatan **database migration**, serta pengembangan **Reporting & Business Intelligence**, sehingga seluruh tim pengembang memiliki definisi data yang konsisten di seluruh modul aplikasi.

