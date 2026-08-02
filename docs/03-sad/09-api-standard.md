# Parakita Software Architecture Document (SAD)

# 09 - API Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 09 - API Standard |
| Part | 1 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | API Design & Development Standard |
| API Style | REST API |
| Data Format | JSON |
| Authentication | JWT Bearer Token |
| Backend | Express.js + TypeScript |
| Last Updated | July 2026 |

---

# Table of Contents (Part 1)

1. Introduction
2. Purpose
3. Scope
4. Target Audience
5. Relationship with Other Documents
6. API Design Principles
7. REST Architecture
8. API Versioning
9. URL Convention
10. HTTP Method Standard
11. Resource Naming Convention
12. Content Type Standard
13. Request Header Standard
14. Response Envelope Standard

---

# 1. Introduction

## 1.1 Overview

Dokumen ini mendefinisikan standar pengembangan REST API pada sistem **Parakita**.

Seluruh endpoint yang dikembangkan oleh Backend Team wajib mengikuti standar yang dijelaskan dalam dokumen ini agar menghasilkan API yang:

- Konsisten
- Mudah dipahami
- Mudah dipelihara
- Aman
- Mudah diintegrasikan
- Mendukung pengembangan jangka panjang

Dokumen ini menjadi acuan utama bagi seluruh proses implementasi API mulai dari perancangan endpoint, request, response, autentikasi, hingga penanganan error.

---

## 1.2 Background

Parakita dibangun menggunakan pendekatan **API First** sehingga seluruh komunikasi antara Frontend dan Backend dilakukan melalui REST API.

Standarisasi API diperlukan agar:

- Struktur endpoint seragam.
- Format request dan response konsisten.
- Error handling mudah dipahami.
- Dokumentasi API mudah dibuat.
- Integrasi antar modul lebih sederhana.
- Frontend dan Backend dapat dikembangkan secara paralel.

---

## 1.3 Objectives

Dokumen ini bertujuan untuk:

- Menjadi standar desain REST API.
- Menentukan pola URL endpoint.
- Menentukan standar HTTP Method.
- Menentukan format request dan response.
- Menentukan standar authentication.
- Menentukan standar error handling.
- Menentukan aturan pagination, filtering, dan sorting.
- Menjadi referensi implementasi OpenAPI/Swagger.

---

# 2. Purpose

Dokumen ini digunakan sebagai pedoman bagi seluruh developer agar implementasi API memiliki kualitas dan konsistensi yang sama.

Secara khusus dokumen ini bertujuan untuk:

- Menyeragamkan seluruh endpoint.
- Mengurangi inkonsistensi response.
- Mempermudah code review.
- Mempermudah proses testing.
- Mempermudah integrasi frontend.
- Menyiapkan dokumentasi API otomatis.

---

# 3. Scope

Dokumen ini mencakup seluruh REST API yang digunakan oleh sistem Parakita.

Standar yang dibahas meliputi:

- Endpoint Design
- HTTP Method
- URL Structure
- Request Format
- Response Format
- Authentication
- Authorization
- Pagination
- Filtering
- Sorting
- Error Response
- Upload File
- API Versioning
- OpenAPI Specification

Dokumen ini tidak membahas:

- Business Process
- Database Design
- UI/UX
- Deployment
- Internal Domain Logic

---

# 4. Target Audience

Dokumen ini digunakan oleh seluruh tim engineering.

| Role | Purpose |
|------|---------|
| Solution Architect | Menentukan standar API |
| Technical Lead | Review desain endpoint |
| Backend Developer | Implementasi REST API |
| Frontend Developer | Integrasi API |
| QA Engineer | Menyusun test scenario |
| DevOps Engineer | Monitoring dan deployment API |

---

# 5. Relationship with Other Documents

Dokumen API Standard merupakan bagian dari keseluruhan blueprint Parakita.

```text
01-System Overview
        │
        ▼
Business Architecture

        │

02-System Architecture
        │
        ▼
Technical Architecture

        │

03-Clean Architecture
        │
        ▼
Implementation Guideline

        │

05-Coding Standard
        │
        ▼
Coding Convention

        │

06-Database Design
        │
        ▼
Persistence Layer

        │

07-Data Dictionary
        │
        ▼
Data Definition

        │

08-ERD
        │
        ▼
Entity Relationship

        │

09-API Standard
        │
        ▼
REST API Specification
```

Hubungan antar dokumen adalah sebagai berikut.

| Document | Focus |
|----------|-----------------------------|
|01-System Overview|Business Overview|
|02-System Architecture|Technical Architecture|
|03-Clean Architecture|Implementation Guideline|
|05-Coding Standard|Coding Convention|
|06-Database Design|Database Structure|
|07-Data Dictionary|Field Definition|
|08-ERD|Entity Relationship|
|09-API Standard|REST API Specification|

---

# 6. API Design Principles

Seluruh REST API pada Parakita wajib mengikuti prinsip berikut.

## 6.1 API First

Backend dikembangkan berdasarkan kontrak API yang telah disepakati.

Keuntungan:

- Frontend dapat mulai bekerja lebih awal.
- Dokumentasi tersedia sejak awal.
- Integrasi lebih mudah.
- Perubahan API dapat dikontrol.

---

## 6.2 Resource Oriented

Endpoint harus merepresentasikan resource, bukan aksi.

Contoh yang benar:

```text
GET /api/v1/patients

POST /api/v1/patients

GET /api/v1/reservations
```

Contoh yang tidak disarankan:

```text
GET /api/v1/getPatient

POST /api/v1/createPatient

POST /api/v1/updateReservation
```

---

## 6.3 Stateless

REST API tidak menyimpan session pada server.

Setiap request harus membawa informasi autentikasi yang diperlukan.

Contoh:

```http
Authorization: Bearer <access_token>
```

---

## 6.4 Consistency

Seluruh endpoint harus menggunakan:

- Format URL yang konsisten.
- Struktur response yang sama.
- HTTP Status Code yang sesuai.
- Penamaan resource yang seragam.

---

## 6.5 Secure by Default

Seluruh endpoint yang membutuhkan autentikasi wajib:

- Menggunakan HTTPS.
- Menggunakan JWT Bearer Token.
- Memiliki Authorization (RBAC).
- Melakukan validasi input.
- Mencatat Audit Trail.

---

# 7. REST Architecture

Parakita menggunakan arsitektur REST berbasis JSON.

```text
Client

↓

HTTPS

↓

REST API

↓

Controller

↓

Application Service

↓

Repository

↓

Database
```

Karakteristik REST yang diterapkan:

- Stateless
- Resource Based
- Client Server
- Layered System
- Uniform Interface

---

# 8. API Versioning

Seluruh endpoint wajib menggunakan versi API.

Format:

```text
/api/v1/
```

Contoh:

```text
GET /api/v1/patients

POST /api/v1/patients

GET /api/v1/reservations

GET /api/v1/invoices
```

---

## Version Policy

| Version | Status |
|----------|--------|
| v1 | Active |
| v2 | Future |
| v3 | Reserved |

Perubahan yang bersifat breaking change harus dilakukan melalui versi API baru.

---

# 9. URL Convention

Seluruh endpoint menggunakan format berikut.

```text
/api/{version}/{resource}
```

Contoh:

```text
/api/v1/patients

/api/v1/reservations

/api/v1/queues

/api/v1/emr

/api/v1/invoices

/api/v1/payments
```

---

## URL Rules

Gunakan:

- lowercase
- plural noun
- hyphen (-) jika diperlukan
- tanpa underscore
- tanpa camelCase

Benar:

```text
/api/v1/patient-groups

/api/v1/payment-methods
```

Salah:

```text
/api/v1/PatientGroup

/api/v1/getPatient

/api/v1/payment_methods
```

---

# 10. HTTP Method Standard

Seluruh endpoint wajib menggunakan HTTP Method sesuai standar REST.

| Method | Purpose | Idempotent |
|---------|----------|------------|
| GET | Read Resource | Yes |
| POST | Create Resource | No |
| PUT | Replace Resource | Yes |
| PATCH | Partial Update | No |
| DELETE | Delete Resource | Yes |

---

## Example

```http
GET /patients

GET /patients/{id}

POST /patients

PUT /patients/{id}

PATCH /patients/{id}

DELETE /patients/{id}
```

---

# 11. Resource Naming Convention

Gunakan kata benda (noun), bukan kata kerja (verb).

Benar:

```text
patients

reservations

queues

visits

odontograms

treatments

payments

employees
```

Salah:

```text
createPatient

savePatient

updatePatient

deletePatient
```

---

## Nested Resource

Gunakan nested resource hanya jika hubungan bersifat hierarkis.

Contoh:

```text
GET /patients/{patientId}/visits

GET /visits/{visitId}/treatments

GET /invoices/{invoiceId}/payments
```

---

# 12. Content Type Standard

Semua request dan response menggunakan format JSON.

Request Header:

```http
Content-Type: application/json
Accept: application/json
```

Response Header:

```http
Content-Type: application/json
```

Untuk upload file digunakan:

```http
Content-Type: multipart/form-data
```

---

# 13. Request Header Standard

Header berikut digunakan secara konsisten.

| Header | Required | Description |
|----------|----------|-------------|
| Authorization | Yes* | JWT Bearer Token |
| Content-Type | Yes | Format Request |
| Accept | Yes | Format Response |
| X-Correlation-ID | Recommended | Request Tracking |
| X-Request-ID | Optional | Client Request ID |
| Accept-Language | Optional | Localization |

> *Authorization wajib untuk endpoint yang memerlukan autentikasi.

---

## Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Correlation Header

```http
X-Correlation-ID: 2b7c0b61-1c4d-4b18-a4fd-2d31aaf75b18
```

Correlation ID digunakan untuk:

- Logging
- Audit Trail
- Distributed Tracing (Future)
- Error Investigation

---

# 14. Response Envelope Standard

Seluruh endpoint harus menggunakan struktur response yang seragam.

## Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": []
}
```

---

## List Response

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  }
}
```

---

## Response Principles

Seluruh response harus memenuhi prinsip berikut:

- Konsisten di seluruh modul.
- Tidak mengembalikan stack trace.
- Menggunakan HTTP Status Code yang sesuai.
- Memiliki pesan yang mudah dipahami.
- Mendukung pagination untuk data koleksi.
- Memisahkan data utama (`data`) dari metadata (`meta`).

---

# Summary Part 1

Part 1 mendefinisikan fondasi standar REST API pada Parakita, meliputi tujuan, ruang lingkup, prinsip desain API, arsitektur REST, versioning, konvensi URL, penggunaan HTTP Method, penamaan resource, standar header, serta format response yang konsisten. Dokumen ini menjadi acuan utama bagi seluruh Backend Developer, Frontend Developer, QA Engineer, dan integrator dalam merancang serta mengimplementasikan REST API yang aman, konsisten, dan mudah dipelihara.

# Parakita Software Architecture Document (SAD)

# 09 - API Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 09 - API Standard |
| Part | 2 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | API Design & Development Standard |
| API Style | REST API |
| Last Updated | July 2026 |

---

# Table of Contents (Part 2)

15. Success Response Standard
16. Error Response Standard
17. HTTP Status Code Standard
18. Pagination Standard
19. Filtering Standard
20. Searching Standard
21. Sorting Standard
22. Field Selection
23. Include Relation
24. Metadata Standard
25. Response Data Guideline

---

# 15. Success Response Standard

## 15.1 Overview

Seluruh endpoint wajib mengembalikan format response yang konsisten.

Response yang konsisten memudahkan:

- Frontend Development
- Mobile Development
- API Integration
- Testing
- Logging
- Monitoring

---

## 15.2 Standard Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## 15.3 Success Response Structure

| Field | Type | Required | Description |
|---------|------|----------|-------------|
| success | boolean | Yes | Status request |
| message | string | Yes | Informasi hasil request |
| data | object/array | Yes | Payload utama |
| meta | object | Optional | Metadata |

---

## 15.4 Create Response

```json
{
  "success": true,
  "message": "Patient created successfully.",
  "data": {
    "id": "PAT-000001"
  }
}
```

---

## 15.5 Update Response

```json
{
  "success": true,
  "message": "Patient updated successfully.",
  "data": {
    "id": "PAT-000001"
  }
}
```

---

## 15.6 Delete Response

```json
{
  "success": true,
  "message": "Patient deleted successfully.",
  "data": null
}
```

---

# 16. Error Response Standard

## 16.1 Overview

Semua error wajib menggunakan format yang sama.

---

## 16.2 Validation Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "fullName",
      "message": "Full name is required."
    }
  ]
}
```

---

## 16.3 Business Error

```json
{
  "success": false,
  "message": "Doctor schedule is full.",
  "errors": []
}
```

---

## 16.4 Not Found

```json
{
  "success": false,
  "message": "Patient not found.",
  "errors": []
}
```

---

## 16.5 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized.",
  "errors": []
}
```

---

## 16.6 Forbidden

```json
{
  "success": false,
  "message": "Permission denied.",
  "errors": []
}
```

---

## 16.7 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error.",
  "errors": []
}
```

---

# 17. HTTP Status Code Standard

Seluruh endpoint harus menggunakan HTTP Status Code sesuai standar REST.

| Status | Name | Usage |
|---------|------------------------|----------------------------|
|200|OK|GET, PUT, PATCH berhasil|
|201|Created|POST berhasil|
|202|Accepted|Async Process|
|204|No Content|Delete berhasil|
|400|Bad Request|Format request salah|
|401|Unauthorized|Token tidak valid|
|403|Forbidden|Tidak memiliki permission|
|404|Not Found|Data tidak ditemukan|
|409|Conflict|Duplicate data|
|422|Unprocessable Entity|Business validation gagal|
|429|Too Many Requests|Rate limit|
|500|Internal Server Error|Unexpected error|

---

## Example

```http
HTTP/1.1 201 Created
```

```json
{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {}
}
```

---

# 18. Pagination Standard

Endpoint list wajib mendukung pagination.

---

## Request

```http
GET /api/v1/patients?page=1&limit=20
```

---

## Default Value

| Parameter | Default | Max |
|------------|----------|------|
| page | 1 | - |
| limit | 20 | 100 |

---

## Response

```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 152,
    "totalPages": 8
  }
}
```

---

## Meta Fields

| Field | Description |
|---------|------------------|
| page | Current page |
| limit | Records per page |
| total | Total records |
| totalPages | Total pages |

---

# 19. Filtering Standard

Filtering dilakukan menggunakan Query Parameter.

---

## Example

```http
GET /api/v1/patients?gender=FEMALE
```

```http
GET /api/v1/patients?isActive=true
```

```http
GET /api/v1/reservations?status=CONFIRMED
```

---

## Multiple Filter

```http
GET /api/v1/patients?gender=MALE&isActive=true
```

---

## Date Filter

```http
GET /api/v1/invoices?from=2026-07-01&to=2026-07-31
```

---

# 20. Searching Standard

Pencarian menggunakan parameter **search**.

---

## Example

```http
GET /api/v1/patients?search=john
```

```http
GET /api/v1/doctors?search=andi
```

---

## Rules

Search bersifat:

- Case insensitive
- Partial matching
- Menggunakan indexed column jika memungkinkan

---

# 21. Sorting Standard

Sorting menggunakan parameter **sort** dan **order**.

---

## Example

Ascending

```http
GET /api/v1/patients?sort=fullName&order=asc
```

Descending

```http
GET /api/v1/patients?sort=createdAt&order=desc
```

---

## Rules

Default:

```text
sort=createdAt

order=desc
```

---

## Allowed Order

- asc
- desc

---

# 22. Field Selection

Client dapat meminta field tertentu untuk mengurangi ukuran payload.

---

## Example

```http
GET /api/v1/patients?fields=id,medicalRecordNumber,fullName
```

---

## Response

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "PAT-001",
      "medicalRecordNumber": "MR000001",
      "fullName": "John Doe"
    }
  ]
}
```

---

## Rules

- Field yang diminta harus valid.
- Field sensitif tidak boleh dikirim.
- Default response tetap mengirim field standar apabila parameter tidak diberikan.

---

# 23. Include Relation

Endpoint dapat mendukung include relation.

---

## Example

```http
GET /api/v1/patients/1?include=visits
```

```http
GET /api/v1/reservations/1?include=patient,doctor
```

---

## Multiple Include

```http
GET /api/v1/visits/1?include=patient,treatments,payment
```

---

## Rules

- Hanya relation yang diizinkan.
- Maksimal kedalaman include = 2 level.
- Hindari circular relation.

---

# 24. Metadata Standard

Metadata ditempatkan pada properti **meta**.

---

## Standard

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

---

## Additional Metadata

```json
{
  "meta": {
    "requestId": "REQ-20260731-0001",
    "timestamp": "2026-07-31T09:15:30Z",
    "version": "v1"
  }
}
```

---

# 25. Response Data Guideline

Seluruh response API harus mengikuti pedoman berikut.

## Do

✔ Gunakan camelCase pada field JSON.

✔ Gunakan ISO 8601 untuk tanggal.

✔ Gunakan boolean untuk status.

✔ Gunakan array kosong (`[]`) daripada `null` untuk koleksi.

✔ Gunakan object kosong (`{}`) bila diperlukan.

---

## Don't

✖ Mengirim stack trace.

✖ Mengirim error database.

✖ Mengirim password.

✖ Mengirim refresh token.

✖ Mengirim internal identifier yang tidak diperlukan.

---

## JSON Naming Example

```json
{
  "patientId": "PAT-000001",
  "medicalRecordNumber": "MR000001",
  "fullName": "John Doe",
  "birthDate": "1995-08-10",
  "isActive": true,
  "createdAt": "2026-07-31T09:15:30Z"
}
```

---

# Summary Part 2

Part 2 mendefinisikan standar request dan response REST API Parakita, termasuk format response sukses dan error, penggunaan HTTP Status Code, pagination, filtering, searching, sorting, field selection, include relation, metadata, serta pedoman penyusunan payload JSON. Standar ini memastikan seluruh endpoint memiliki perilaku yang konsisten, mudah diintegrasikan, dan sesuai dengan prinsip REST API yang diterapkan pada sistem Parakita.

```

# Parakita Software Architecture Document (SAD)

# 09 - API Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 09 - API Standard |
| Part | 3 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | API Design & Development Standard |
| API Style | REST API |
| Security | JWT + RBAC |
| Last Updated | July 2026 |

---

# Table of Contents (Part 3)

26. Authentication Standard
27. JWT Access Token
28. Refresh Token
29. Authorization Standard
30. Role Based Access Control (RBAC)
31. Permission Standard
32. Idempotency
33. Rate Limiting
34. CORS Policy
35. API Security Best Practice
36. Audit Information

---

# 26. Authentication Standard

## 26.1 Overview

Seluruh endpoint Parakita dibagi menjadi dua kategori:

- Public Endpoint
- Protected Endpoint

Public Endpoint dapat diakses tanpa login.

Protected Endpoint wajib menggunakan JWT Access Token.

---

## 26.2 Public Endpoint

Contoh:

```text
POST /api/v1/auth/login

POST /api/v1/auth/refresh

POST /api/v1/auth/forgot-password

POST /api/v1/auth/reset-password
```

---

## 26.3 Protected Endpoint

Semua endpoint bisnis wajib menggunakan Authorization Header.

Contoh:

```http
GET /api/v1/patients

Authorization: Bearer <access_token>
```

---

## 26.4 Authentication Flow

```mermaid
sequenceDiagram

Client->>API: Login

API->>Database: Validate User

Database-->>API: User Found

API->>JWT: Generate Token

JWT-->>Client: Access Token + Refresh Token

Client->>API: API Request

API->>JWT: Validate Token

JWT-->>API: Valid

API-->>Client: JSON Response
```

---

# 27. JWT Access Token

## 27.1 Purpose

Access Token digunakan untuk mengakses Protected API.

Access Token memiliki masa berlaku pendek.

---

## 27.2 Authorization Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 27.3 JWT Payload

Payload minimal berisi informasi berikut.

```json
{
  "sub": "USR-000001",
  "username": "admin",
  "role": "Administrator",
  "branchId": "BR001",
  "iat": 1780000000,
  "exp": 1780003600
}
```

---

## 27.4 JWT Rules

- Signed menggunakan secret key.
- Tidak menyimpan password.
- Tidak menyimpan data sensitif.
- Expired dalam waktu singkat.
- Wajib diverifikasi pada setiap request.

---

# 28. Refresh Token

## 28.1 Overview

Refresh Token digunakan untuk memperoleh Access Token baru tanpa melakukan login kembali.

---

## 28.2 Refresh Flow

```mermaid
flowchart LR

Login

-->

Access Token

-->

Expired

-->

Refresh Token

-->

New Access Token
```

---

## 28.3 Refresh Endpoint

```http
POST /api/v1/auth/refresh
```

---

## Request

```json
{
  "refreshToken": "xxxxxxxxxxxxxxxx"
}
```

---

## Response

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 28.4 Rules

- Refresh Token disimpan secara aman.
- Refresh Token memiliki masa berlaku lebih lama.
- Refresh Token dapat dicabut (revoked).
- Logout menghapus Refresh Token.

---

# 29. Authorization Standard

## 29.1 Overview

Setelah JWT berhasil diverifikasi, sistem melakukan pemeriksaan hak akses.

Authorization dilakukan menggunakan Role Based Access Control (RBAC).

---

## Authorization Flow

```mermaid
flowchart LR

JWT

-->

Role

-->

Permission

-->

Endpoint

-->

Controller
```

---

## Authorization Sequence

1. Validate JWT
2. Load User
3. Load Role
4. Load Permission
5. Verify Permission
6. Execute Endpoint

---

## Failure Response

```json
{
  "success": false,
  "message": "Permission denied.",
  "errors": []
}
```

---

# 30. Role Based Access Control (RBAC)

## 30.1 Overview

Hak akses API ditentukan berdasarkan Role.

---

## Standard Roles

| Role | Description |
|------|-------------|
| Owner | Full Reporting |
| Clinic Manager | Operational Monitoring |
| Administrator | System Administration |
| Registration | Registration & Reservation |
| Doctor | EMR |
| Nurse | Clinical Assistant |
| Cashier | Billing & Payment |
| Warehouse | Inventory |
| Finance | Finance |
| Human Resource | HR |

---

## Example

```text
Doctor

✔ GET /emr

✔ POST /emr

✔ PATCH /emr

✖ DELETE /users

✖ POST /finance
```

---

# 31. Permission Standard

Permission lebih spesifik dibanding Role.

---

## Permission Format

Gunakan format:

```text
module.action
```

---

## Example

```text
patient.read

patient.create

patient.update

patient.delete

reservation.read

reservation.create

emr.update

billing.payment

finance.closing

report.export
```

---

## Permission Matrix

| Permission | Description |
|------------|-------------|
| read | Melihat data |
| create | Membuat data |
| update | Mengubah data |
| delete | Menghapus data |
| approve | Approval |
| cancel | Membatalkan |
| refund | Refund |
| export | Export Report |
| print | Cetak |

---

## Authorization Middleware

Middleware wajib melakukan:

- Validate JWT
- Validate Role
- Validate Permission
- Audit Access

---

# 32. Idempotency

## Overview

Operasi tertentu harus mendukung Idempotency.

Hal ini mencegah transaksi ganda akibat retry.

---

## Endpoint Candidate

- Payment
- Refund
- Invoice Generation
- Closing
- Stock Adjustment

---

## Header

```http
Idempotency-Key: 8cbdd79f-dfd4-4af8-a931-feb47bc26d65
```

---

## Rules

Server wajib:

- Menyimpan Idempotency Key.
- Mengembalikan response yang sama.
- Menolak duplicate request yang masih aktif.

---

# 33. Rate Limiting

## Purpose

Rate Limiting digunakan untuk melindungi API dari penyalahgunaan.

---

## Recommendation

| Endpoint | Limit |
|----------|-----------|
| Login | 5 request / menit |
| Refresh Token | 10 request / menit |
| Public API | 60 request / menit |
| Protected API | 300 request / menit |

---

## Response

```http
HTTP 429 Too Many Requests
```

```json
{
  "success": false,
  "message": "Too many requests.",
  "errors": []
}
```

---

# 34. CORS Policy

## Allowed Origin

Development

```text
http://localhost:3000
```

Production

```text
https://app.parakita.com
```

---

## Allowed Method

```text
GET

POST

PUT

PATCH

DELETE

OPTIONS
```

---

## Allowed Header

```text
Authorization

Content-Type

Accept

X-Correlation-ID

Idempotency-Key
```

---

## Credential

```text
Access-Control-Allow-Credentials: true
```

---

# 35. API Security Best Practice

Seluruh endpoint wajib mengikuti prinsip keamanan berikut.

## Authentication

✔ JWT Bearer Token

✔ HTTPS Only

✔ Short Access Token Lifetime

✔ Refresh Token Rotation

---

## Authorization

✔ RBAC

✔ Permission Based

✔ Least Privilege Principle

---

## Validation

✔ Validate Input

✔ Sanitize Request

✔ Reject Unknown Field

✔ Validate Content Type

---

## Sensitive Data

API tidak boleh mengirim:

- Password
- Password Hash
- Refresh Token (kecuali endpoint refresh)
- Secret Key
- Internal Token
- Database Error
- Stack Trace

---

## Logging

Seluruh request penting wajib dicatat.

Minimal:

- User ID
- Endpoint
- Method
- Status Code
- Response Time
- IP Address
- Correlation ID

---

# 36. Audit Information

## Purpose

Seluruh aktivitas API yang memengaruhi data bisnis harus dicatat.

---

## Audit Event

- Login
- Logout
- Create Patient
- Update Patient
- Delete Patient
- Reservation
- Check In
- Start Visit
- Save EMR
- Payment
- Refund
- Stock Adjustment
- Closing
- User Management

---

## Audit Record

| Field | Description |
|--------|-------------|
| Timestamp | Waktu kejadian |
| User ID | Pengguna |
| Role | Role pengguna |
| Module | Nama modul |
| Endpoint | API Endpoint |
| HTTP Method | GET/POST/PUT |
| Action | Aktivitas |
| Entity | Nama Entity |
| Entity ID | ID Data |
| Status Code | HTTP Status |
| IP Address | Client IP |
| User Agent | Browser/Device |
| Correlation ID | Request Identifier |

---

## Audit Flow

```mermaid
flowchart LR

HTTP_Request

-->

Authentication

-->

Authorization

-->

Controller

-->

Business_Process

-->

Audit_Logger

-->

Audit_Database
```

---

# Summary Part 3

Part 3 mendefinisikan standar keamanan REST API Parakita, meliputi mekanisme Authentication menggunakan JWT dan Refresh Token, Authorization berbasis Role dan Permission (RBAC), Idempotency, Rate Limiting, CORS Policy, Security Best Practice, serta Audit Information. Standar ini memastikan seluruh endpoint terlindungi secara konsisten, memenuhi prinsip **Security by Design**, dan siap mendukung kebutuhan audit, monitoring, serta pengembangan sistem di masa mendatang.
```


# Parakita Software Architecture Document (SAD)

# 09 - API Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 09 - API Standard |
| Part | 4 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | API Design & Development Standard |
| API Style | REST API |
| Last Updated | July 2026 |

---

# Table of Contents (Part 4)

37. CRUD Endpoint Standard
38. Nested Resource Standard
39. Batch Operation Standard
40. File Upload Standard
41. File Download Standard
42. Asynchronous Operation
43. Webhook Standard (Future)
44. API Version Migration
45. API Deprecation Policy
46. Error Catalog

---

# 37. CRUD Endpoint Standard

## 37.1 Overview

Seluruh resource wajib mengikuti pola CRUD yang konsisten.

---

## Standard Endpoint

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List | GET | /api/v1/patients |
| Detail | GET | /api/v1/patients/{id} |
| Create | POST | /api/v1/patients |
| Replace | PUT | /api/v1/patients/{id} |
| Update | PATCH | /api/v1/patients/{id} |
| Delete | DELETE | /api/v1/patients/{id} |

---

## Example

```http
GET /api/v1/patients

GET /api/v1/patients/PAT-000001

POST /api/v1/patients

PUT /api/v1/patients/PAT-000001

PATCH /api/v1/patients/PAT-000001

DELETE /api/v1/patients/PAT-000001
```

---

## Collection Endpoint

Collection endpoint tidak menerima ID.

Contoh:

```http
GET /api/v1/doctors

GET /api/v1/treatments

GET /api/v1/payment-methods
```

---

## Single Resource Endpoint

Menggunakan identifier pada URL.

```http
GET /api/v1/doctors/DOC-000001
```

---

# 38. Nested Resource Standard

## Purpose

Nested Resource digunakan untuk merepresentasikan hubungan parent-child.

---

## Example

```http
GET /api/v1/patients/{patientId}/visits

GET /api/v1/visits/{visitId}/treatments

GET /api/v1/invoices/{invoiceId}/payments
```

---

## Multiple Level

Maksimal dua level.

Benar

```http
GET /patients/{id}/visits

GET /visits/{id}/treatments
```

Tidak disarankan

```http
GET /patients/{id}/visits/{visitId}/treatments/{treatmentId}/materials
```

---

## Rules

- Maksimal 2 level.
- Hindari nested resource yang terlalu panjang.
- Gunakan query parameter bila relasi tidak bersifat hierarkis.

---

# 39. Batch Operation Standard

## Overview

Operasi batch digunakan untuk memproses banyak data sekaligus.

---

## Endpoint

```http
POST /api/v1/patients/batch

POST /api/v1/payments/batch

POST /api/v1/invoices/batch-print
```

---

## Batch Request

```json
{
  "ids": [
    "PAT-000001",
    "PAT-000002",
    "PAT-000003"
  ]
}
```

---

## Batch Response

```json
{
  "success": true,
  "message": "Batch operation completed.",
  "data": {
    "processed": 3,
    "failed": 0
  }
}
```

---

## Rules

- Maksimum 100 data per request.
- Gunakan transaction jika seluruh data harus berhasil.
- Kembalikan detail error bila terjadi partial failure.

---

# 40. File Upload Standard

## Overview

Upload file menggunakan multipart/form-data.

---

## Endpoint

```http
POST /api/v1/files/upload
```

---

## Header

```http
Content-Type: multipart/form-data
```

---

## Response

```json
{
  "success": true,
  "message": "File uploaded successfully.",
  "data": {
    "fileId": "FIL-000001",
    "fileName": "xray.png",
    "mimeType": "image/png",
    "size": 524288,
    "url": "/api/v1/files/FIL-000001"
  }
}
```

---

## Allowed File Type

| Category | Extension |
|----------|-----------|
| Image | jpg, jpeg, png, webp |
| PDF | pdf |
| Document | docx, xlsx |
| Archive | zip |

---

## File Size Recommendation

| Category | Maximum Size |
|----------|--------------|
| Image | 10 MB |
| PDF | 20 MB |
| Document | 20 MB |
| Archive | 50 MB |

---

## Validation

Server wajib memvalidasi:

- MIME Type
- File Extension
- File Size
- Malware Scan (Future)

---

# 41. File Download Standard

## Download Endpoint

```http
GET /api/v1/files/{fileId}
```

---

## Response Header

```http
Content-Disposition: attachment
Content-Type: application/pdf
```

---

## Rules

- Wajib Authentication.
- Authorization mengikuti hak akses file.
- Download dicatat pada Audit Log.

---

# 42. Asynchronous Operation

## Overview

Operasi yang membutuhkan waktu lama sebaiknya berjalan secara asynchronous.

Contoh:

- Generate Report
- Export Excel
- Export PDF
- Backup Database
- Import Master Data

---

## Request

```http
POST /api/v1/reports/export
```

---

## Response

```http
HTTP 202 Accepted
```

```json
{
  "success": true,
  "message": "Export request accepted.",
  "data": {
    "jobId": "JOB-20260731-0001",
    "status": "PENDING"
  }
}
```

---

## Job Status Endpoint

```http
GET /api/v1/jobs/{jobId}
```

---

## Job Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "jobId": "JOB-20260731-0001",
    "status": "COMPLETED",
    "downloadUrl": "/api/v1/files/FIL-000123"
  }
}
```

---

## Job Status

| Status | Description |
|--------|-------------|
| PENDING | Waiting |
| PROCESSING | Running |
| COMPLETED | Success |
| FAILED | Error |
| CANCELLED | Cancelled |

---

# 43. Webhook Standard (Future)

## Overview

Webhook akan digunakan untuk integrasi dengan sistem eksternal.

Contoh:

- Payment Gateway
- WhatsApp Gateway
- SMS Gateway
- BPJS Integration
- Laboratory System

---

## Endpoint

```http
POST /api/v1/webhooks/payment
```

---

## Security

Webhook wajib menggunakan:

- HTTPS
- Signature Verification
- Timestamp Validation
- Replay Protection

---

## Response

```http
HTTP 200 OK
```

---

# 44. API Version Migration

## Purpose

Version Migration memastikan perubahan besar tidak merusak integrasi yang telah ada.

---

## URL Versioning

```text
/api/v1/patients

/api/v2/patients
```

---

## Breaking Change

Perubahan berikut memerlukan versi baru:

- Menghapus field response.
- Mengubah struktur response.
- Mengubah endpoint.
- Mengubah request wajib.
- Mengubah authentication.

---

## Non-Breaking Change

Tidak memerlukan versi baru apabila:

- Menambah field response.
- Menambah endpoint baru.
- Menambah query parameter opsional.
- Perbaikan bug.

---

# 45. API Deprecation Policy

## Overview

Endpoint lama tidak boleh langsung dihapus.

---

## Deprecation Lifecycle

```text
Active

↓

Deprecated

↓

Sunset

↓

Removed
```

---

## Deprecation Header

```http
Deprecation: true
Sunset: Wed, 31 Dec 2027 23:59:59 GMT
```

---

## Recommendation

- Berikan pemberitahuan minimal 6 bulan.
- Dokumentasikan endpoint pengganti.
- Hindari breaking change pada minor release.

---

# 46. Error Catalog

## Standard Error Code

| HTTP | Code | Description |
|------|----------------------|-------------------------------|
|400|BAD_REQUEST|Invalid request|
|401|UNAUTHORIZED|Authentication required|
|403|FORBIDDEN|Permission denied|
|404|NOT_FOUND|Resource not found|
|409|CONFLICT|Duplicate resource|
|422|VALIDATION_ERROR|Validation failed|
|429|RATE_LIMIT_EXCEEDED|Too many requests|
|500|INTERNAL_SERVER_ERROR|Unexpected error|

---

## Business Error Code

| Code | Description |
|------|-----------------------------|
|PATIENT_ALREADY_EXISTS|Duplicate patient|
|PATIENT_NOT_FOUND|Patient not found|
|DOCTOR_NOT_AVAILABLE|Doctor unavailable|
|RESERVATION_CONFLICT|Schedule conflict|
|EMR_LOCKED|Medical record locked|
|INVOICE_ALREADY_PAID|Invoice already paid|
|PAYMENT_FAILED|Payment failed|
|INSUFFICIENT_STOCK|Stock not available|
|CLOSING_ALREADY_DONE|Closing completed|

---

## Error Response Example

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "code": "PATIENT_ALREADY_EXISTS",
      "field": "nationalId",
      "message": "Patient with the same National ID already exists."
    }
  ]
}
```

---

## Error Handling Principles

Seluruh error harus memenuhi prinsip berikut.

- Menggunakan HTTP Status Code yang tepat.
- Menggunakan Business Error Code yang konsisten.
- Tidak mengembalikan stack trace.
- Tidak mengekspos detail database.
- Mudah dipahami oleh Frontend dan QA.

---

# Summary Part 4

Part 4 mendefinisikan standar desain endpoint REST API Parakita, mencakup pola CRUD, nested resource, batch operation, upload dan download file, asynchronous processing, webhook untuk integrasi eksternal, kebijakan migrasi versi API, deprecation policy, serta katalog error yang konsisten. Standar ini memastikan seluruh endpoint memiliki pola implementasi yang seragam, mudah dipelihara, aman, dan siap berkembang seiring kebutuhan sistem.

# Parakita Software Architecture Document (SAD)

# 09 - API Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 09 - API Standard |
| Part | 5 of 5 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | API Design & Development Standard |
| API Style | REST API |
| Documentation | OpenAPI 3.1 |
| Last Updated | July 2026 |

---

# Table of Contents (Part 5)

47. Naming Convention
48. OpenAPI / Swagger Standard
49. Endpoint Documentation Standard
50. Module Endpoint Examples
51. Sample Request & Response
52. API Review Checklist
53. API Testing Guideline
54. API Performance Guideline
55. API Best Practices
56. Summary

---

# 47. Naming Convention

## 47.1 Resource Naming

Gunakan kata benda (noun) dalam bentuk plural.

Contoh:

```text
patients

reservations

queues

appointments

visits

treatments

payments

employees

roles

permissions
```

---

## 47.2 URL Naming

Gunakan:

- lowercase
- plural noun
- hyphen (-)
- tanpa underscore
- tanpa camelCase

Benar

```text
/api/v1/payment-methods

/api/v1/medical-records

/api/v1/clinic-branches
```

Salah

```text
/api/v1/paymentMethods

/api/v1/payment_methods

/api/v1/GetPatient
```

---

## 47.3 JSON Field Naming

Semua field JSON menggunakan camelCase.

Contoh:

```json
{
  "patientId": "PAT-000001",
  "medicalRecordNumber": "MR000001",
  "fullName": "John Doe",
  "birthDate": "1995-08-10",
  "isActive": true,
  "createdAt": "2026-07-31T08:00:00Z"
}
```

---

## 47.4 Identifier Naming

Gunakan identifier yang konsisten.

| Resource | Prefix |
|----------|---------|
| Patient | PAT |
| Reservation | RSV |
| Queue | QUE |
| Visit | VIS |
| EMR | EMR |
| Invoice | INV |
| Payment | PAY |
| Employee | EMP |
| Branch | BR |
| User | USR |

---

# 48. OpenAPI / Swagger Standard

## 48.1 Overview

Seluruh REST API wajib didokumentasikan menggunakan OpenAPI Specification.

Versi yang digunakan:

```text
OpenAPI 3.1
```

---

## 48.2 Documentation Requirement

Setiap endpoint wajib memiliki:

- Summary
- Description
- Tags
- Parameters
- Request Body
- Response
- Error Response
- Security Requirement

---

## 48.3 Example

```yaml
GET /patients

Summary:
  Get Patient List

Description:
  Retrieve paginated patient list.

Tags:
  - Patient
```

---

## 48.4 Tag Standard

Dokumentasi dikelompokkan berdasarkan module.

Contoh:

```text
Authentication

Patient

Reservation

Queue

EMR

Billing

Finance

Warehouse

Human Resource

Reporting

System
```

---

## 48.5 Security Definition

Protected endpoint wajib mendefinisikan JWT Bearer Authentication.

```yaml
security:
  - bearerAuth: []
```

---

# 49. Endpoint Documentation Standard

Setiap endpoint harus memiliki dokumentasi lengkap.

---

## Standard Template

| Item | Required |
|------|----------|
| Endpoint | Yes |
| HTTP Method | Yes |
| Description | Yes |
| Authentication | Yes |
| Permission | Yes |
| Request Body | Yes |
| Query Parameter | Optional |
| Path Parameter | Optional |
| Success Response | Yes |
| Error Response | Yes |
| Example | Yes |

---

## Example Documentation

### Create Patient

```http
POST /api/v1/patients
```

Description

Create a new patient.

Authentication

```text
Bearer Token
```

Permission

```text
patient.create
```

---

# 50. Module Endpoint Examples

## Authentication

```text
POST /api/v1/auth/login

POST /api/v1/auth/logout

POST /api/v1/auth/refresh

POST /api/v1/auth/change-password
```

---

## Patient

```text
GET /api/v1/patients

GET /api/v1/patients/{id}

POST /api/v1/patients

PATCH /api/v1/patients/{id}

DELETE /api/v1/patients/{id}
```

---

## Reservation

```text
GET /api/v1/reservations

POST /api/v1/reservations

PATCH /api/v1/reservations/{id}

DELETE /api/v1/reservations/{id}
```

---

## Queue

```text
GET /api/v1/queues

POST /api/v1/queues

PATCH /api/v1/queues/{id}/call

PATCH /api/v1/queues/{id}/complete
```

---

## EMR

```text
GET /api/v1/emr

GET /api/v1/emr/{id}

POST /api/v1/emr

PATCH /api/v1/emr/{id}
```

---

## Billing

```text
GET /api/v1/invoices

POST /api/v1/invoices

GET /api/v1/invoices/{id}

POST /api/v1/payments
```

---

## Warehouse

```text
GET /api/v1/items

POST /api/v1/items

GET /api/v1/stocks

POST /api/v1/stock-adjustments
```

---

## Reporting

```text
GET /api/v1/reports/daily

GET /api/v1/reports/monthly

POST /api/v1/reports/export
```

---

# 51. Sample Request & Response

## Create Patient Request

```http
POST /api/v1/patients
```

```json
{
  "medicalRecordNumber": "MR000001",
  "nationalId": "3275010101010001",
  "fullName": "John Doe",
  "gender": "MALE",
  "birthDate": "1995-08-10",
  "phoneNumber": "081234567890"
}
```

---

## Success Response

```json
{
  "success": true,
  "message": "Patient created successfully.",
  "data": {
    "id": "PAT-000001"
  }
}
```

---

## Validation Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "fullName",
      "message": "Full name is required."
    }
  ]
}
```

---

## Not Found

```json
{
  "success": false,
  "message": "Patient not found.",
  "errors": []
}
```

---

# 52. API Review Checklist

Seluruh endpoint harus melewati proses review.

## Design

- Endpoint menggunakan noun.
- URL mengikuti standar.
- HTTP Method sesuai.
- Versioning benar.
- Tidak menggunakan verb pada endpoint.

---

## Request

- DTO sesuai.
- Validation tersedia.
- Required field jelas.
- Query parameter terdokumentasi.

---

## Response

- Menggunakan response envelope.
- HTTP Status Code benar.
- Error response konsisten.
- Tidak mengirim data sensitif.

---

## Security

- Authentication diterapkan.
- Authorization diterapkan.
- Permission sesuai.
- Audit Log tersedia.
- Input tervalidasi.

---

## Documentation

- Swagger tersedia.
- Contoh request tersedia.
- Contoh response tersedia.
- Error terdokumentasi.

---

# 53. API Testing Guideline

Setiap endpoint minimal memiliki pengujian berikut.

| Test | Required |
|------|----------|
| Success Test | ✔ |
| Validation Test | ✔ |
| Authentication Test | ✔ |
| Authorization Test | ✔ |
| Not Found Test | ✔ |
| Conflict Test | ✔ |
| Performance Test | Recommended |

---

## Example Test Scenario

Patient API

- Create Patient
- Duplicate Patient
- Invalid Request
- Unauthorized
- Forbidden
- Delete Patient
- Update Patient
- Search Patient
- Pagination
- Sorting
- Filtering

---

# 54. API Performance Guideline

## Response Time Target

| Endpoint Type | Target |
|--------------|---------|
| Authentication | < 500 ms |
| CRUD | < 300 ms |
| Search | < 500 ms |
| Reporting | < 2 sec |
| Export | Async |

---

## Recommendation

- Gunakan pagination.
- Hindari N+1 Query.
- Gunakan index database.
- Hindari payload terlalu besar.
- Gunakan caching bila diperlukan.
- Gunakan asynchronous process untuk pekerjaan berat.

---

# 55. API Best Practices

Seluruh developer wajib mengikuti praktik berikut.

## Design

✔ Resource-oriented endpoint.

✔ Gunakan HTTP Method yang benar.

✔ Versioning sejak awal.

✔ Konsisten pada seluruh module.

---

## Security

✔ HTTPS Only.

✔ JWT Authentication.

✔ RBAC.

✔ Input Validation.

✔ Output Sanitization.

---

## Performance

✔ Pagination.

✔ Filtering.

✔ Sorting.

✔ Caching.

✔ Async Processing.

---

## Documentation

✔ Swagger selalu diperbarui.

✔ Contoh request tersedia.

✔ Contoh response tersedia.

✔ Error terdokumentasi.

---

## Maintainability

✔ Gunakan DTO.

✔ Gunakan Response Mapper.

✔ Hindari breaking change.

✔ Gunakan Business Error Code.

✔ Gunakan Correlation ID.

✔ Seluruh endpoint memiliki Unit Test dan Integration Test.

---

# 56. Summary

Dokumen **09 - API Standard** merupakan standar resmi pengembangan REST API pada sistem **Parakita**. Dokumen ini mendefinisikan seluruh aturan mulai dari desain endpoint, struktur URL, HTTP Method, format request dan response, authentication, authorization, pagination, filtering, sorting, upload file, asynchronous processing, versioning, dokumentasi OpenAPI/Swagger, hingga praktik terbaik dalam implementasi API.

Dengan mengikuti standar ini, seluruh API pada setiap modul—Authentication, Patient, Reservation, Queue, EMR, Billing, Finance, Warehouse, Human Resource, Reporting, dan System—akan memiliki desain yang konsisten, mudah dipahami, aman, mudah diuji, dan siap dikembangkan di masa mendatang.

---

# End of Document

**Document:** 09 - API Standard

**Version:** 1.0.0

**Status:** Draft

**Total Parts:** 5

**Next Document:** 10 - Authentication & Authorization



