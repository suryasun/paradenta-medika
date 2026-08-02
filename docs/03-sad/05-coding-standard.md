# Parakita Software Architecture Document (SAD)

# 05 - Coding Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 05 - Coding Standard |
| Part | 1 of 4 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Software Architecture Document (SAD) |
| Architecture Style | Clean Architecture + Domain Driven Design + Modular Monolith |
| Backend | Express.js + TypeScript |
| Frontend | Next.js + TypeScript |
| Last Updated | July 2026 |

---

# Table of Contents (Part 1)

1. Introduction
2. Purpose
3. Scope
4. Relationship with Other Documents
5. Coding Philosophy
6. General Coding Principles
7. Clean Code Principles
8. SOLID Implementation Guidelines
9. DRY, KISS & YAGNI
10. Code Readability Standards

---

# 1. Introduction

## 1.1 Overview

Dokumen ini mendefinisikan **standar penulisan source code (Coding Standard)** yang wajib diikuti oleh seluruh tim pengembangan Parakita.

Apabila:

- **01-System Overview** menjelaskan kebutuhan bisnis,
- **02-System Architecture** menjelaskan desain arsitektur,
- **03-Clean Architecture** menjelaskan pola implementasi,
- **04-Project Structure** menjelaskan organisasi repository,

maka dokumen ini menjelaskan **bagaimana source code harus ditulis agar konsisten, mudah dipahami, mudah dipelihara, dan berkualitas tinggi**.

Dokumen ini berlaku untuk seluruh source code yang berada di dalam repository Parakita, baik Backend, Frontend, Shared Library, maupun Utility.

---

## 1.2 Background

Dalam project yang dikembangkan oleh banyak developer, perbedaan gaya penulisan kode dapat menyebabkan berbagai permasalahan, seperti:

- Sulit membaca source code.
- Sulit melakukan code review.
- Banyak implementasi yang tidak konsisten.
- Technical debt meningkat.
- Proses onboarding developer menjadi lebih lama.
- Bug lebih sulit ditemukan.

Untuk menghindari hal tersebut, Parakita menetapkan standar coding yang berlaku secara konsisten pada seluruh project.

---

## 1.3 Objectives

Dokumen ini bertujuan untuk:

- Menstandarkan gaya penulisan kode.
- Meningkatkan keterbacaan (readability).
- Mengurangi kompleksitas kode.
- Mempermudah proses maintenance.
- Mempermudah code review.
- Menjamin konsistensi implementasi antar developer.
- Mengurangi technical debt.
- Mendukung implementasi Clean Architecture.

---

# 2. Purpose

Coding Standard menjadi acuan resmi seluruh tim engineering dalam menulis source code.

Dokumen ini memastikan bahwa:

- Seluruh developer menggunakan gaya penulisan yang sama.
- Struktur kode mudah dipahami.
- Business Logic mudah ditemukan.
- Perubahan kode memiliki dampak minimal.
- Code Review menjadi lebih cepat.
- Seluruh modul memiliki kualitas implementasi yang seragam.

Dokumen ini merupakan **Engineering Standard** dan wajib dipatuhi oleh seluruh contributor.

---

# 3. Scope

Standar pada dokumen ini berlaku untuk seluruh repository Parakita.

Cakupan dokumen meliputi:

- TypeScript
- Backend Development
- Frontend Development
- Shared Library
- Naming Convention
- Error Handling
- Logging
- Testing
- Documentation
- Git Workflow
- Code Review

Standar ini berlaku untuk:

- Feature baru
- Bug Fix
- Refactoring
- Enhancement
- Technical Improvement

---

# 4. Relationship with Other Documents

Dokumen Coding Standard merupakan bagian terakhir dari Software Architecture Document (SAD).

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

04-Project Structure
        │
        ▼
Repository Organization

        │

05-Coding Standard
        │
        ▼
Source Code Convention
```

| Document | Focus |
|----------|--------------------------------------|
| 01-System Overview | Business Architecture |
| 02-System Architecture | Technical Architecture |
| 03-Clean Architecture | Clean Architecture Guideline |
| 04-Project Structure | Repository Organization |
| 05-Coding Standard | Source Code Convention |

Coding Standard menjadi pedoman implementasi sehari-hari bagi seluruh developer.

---

# 5. Coding Philosophy

## 5.1 Business Logic First

Business Logic merupakan aset utama aplikasi.

Framework, ORM, maupun library hanyalah alat bantu yang dapat berubah sewaktu-waktu.

Seluruh Business Rule harus:

- mudah ditemukan,
- mudah diuji,
- mudah dipahami,
- tidak bergantung pada framework.

---

## 5.2 Readability Over Cleverness

Kode yang mudah dibaca selalu lebih baik daripada kode yang terlalu pintar tetapi sulit dipahami.

Developer lain harus dapat memahami fungsi sebuah file hanya dalam beberapa menit tanpa harus membaca keseluruhan project.

Prioritas utama:

1. Readability
2. Maintainability
3. Simplicity
4. Performance

Optimisasi performa hanya dilakukan apabila memang dibutuhkan berdasarkan hasil pengukuran.

---

## 5.3 Consistency Over Personal Preference

Coding Style merupakan standar tim, bukan preferensi individu.

Seluruh developer wajib mengikuti standar yang telah ditetapkan walaupun berbeda dengan gaya pribadi.

Konsistensi project lebih penting daripada konsistensi masing-masing developer.

---

## 5.4 Explicit is Better than Implicit

Kode harus menjelaskan maksudnya secara eksplisit.

Hindari:

- nama variabel yang ambigu,
- fungsi yang memiliki banyak arti,
- logika tersembunyi,
- magic behavior.

Contoh yang baik:

```text
calculateDoctorFee()

createReservation()

generateInvoice()
```

Lebih baik dibanding:

```text
process()

execute()

handle()
```

---

## 5.5 Self-Documenting Code

Source code harus dapat menjelaskan dirinya sendiri.

Gunakan:

- nama class yang jelas,
- nama function yang deskriptif,
- nama variable yang bermakna.

Komentar hanya digunakan apabila benar-benar diperlukan.

---

# 6. General Coding Principles

Seluruh source code wajib mengikuti prinsip-prinsip berikut.

## 6.1 MUST

Developer wajib:

- menulis kode yang sederhana.
- mengikuti Clean Architecture.
- mengikuti struktur project.
- menggunakan TypeScript secara penuh.
- membuat kode yang mudah diuji.
- menggunakan nama yang jelas.
- menangani seluruh kemungkinan error.
- menghindari duplikasi.

---

## 6.2 SHOULD

Developer sebaiknya:

- membuat function yang kecil.
- menjaga file tetap ringkas.
- memisahkan Business Logic.
- menggunakan immutable object bila memungkinkan.
- membuat kode yang mudah direview.

---

## 6.3 MAY

Developer diperbolehkan:

- membuat utility apabila digunakan lebih dari satu module.
- melakukan refactoring apabila meningkatkan kualitas kode.
- membuat abstraction apabila memang memberikan manfaat nyata.

---

## 6.4 MUST NOT

Developer tidak diperbolehkan:

- menulis Business Logic pada Controller.
- mengakses database langsung dari Controller.
- menggunakan hardcoded configuration.
- melakukan copy-paste Business Logic.
- membuat fungsi dengan banyak tanggung jawab.
- membuat dependency yang melanggar Clean Architecture.

---

# 7. Clean Code Principles

Parakita mengadopsi prinsip-prinsip Clean Code sebagai standar implementasi.

## 7.1 Small Functions

Function harus melakukan satu pekerjaan.

Idealnya:

- satu tujuan,
- satu tanggung jawab,
- satu hasil.

---

## 7.2 Meaningful Names

Gunakan nama yang menjelaskan tujuan.

Contoh:

```text
calculateRemainingStock()

findPatientByMedicalRecord()

completePayment()
```

Hindari:

```text
run()

temp()

doProcess()

handler()
```

---

## 7.3 Single Responsibility

Satu class hanya memiliki satu alasan untuk berubah.

Contoh:

- Controller menerima request.
- Use Case menjalankan proses bisnis.
- Repository mengambil data.
- Validator memvalidasi input.

---

## 7.4 Avoid Deep Nesting

Gunakan early return untuk mengurangi tingkat indentasi.

Lebih mudah dibaca dibanding banyak blok `if` bersarang.

---

## 7.5 Avoid Magic Values

Jangan menggunakan nilai tetap (magic number/string) secara langsung.

Gunakan:

- Constant
- Enum
- Configuration

---

## 7.6 Keep Methods Short

Sebagai panduan umum:

- Function ≤ 30 baris.
- Class ≤ 300 baris.
- File ≤ 500 baris.

Apabila melebihi batas tersebut, developer **SHOULD** mempertimbangkan pemecahan menjadi beberapa komponen yang lebih kecil.

---

# 8. SOLID Implementation Guidelines

Seluruh implementasi wajib mengikuti prinsip SOLID.

| Principle | Guideline |
|-----------|-----------|
| SRP | Satu class memiliki satu tanggung jawab |
| OCP | Mudah dikembangkan tanpa mengubah kode lama |
| LSP | Implementasi dapat menggantikan abstraction |
| ISP | Interface dibuat spesifik sesuai kebutuhan |
| DIP | Bergantung pada abstraction, bukan implementasi |

Penerapan SOLID bersifat wajib pada seluruh Business Module.

---

# 9. DRY, KISS & YAGNI

## 9.1 DRY (Don't Repeat Yourself)

Business Logic tidak boleh diduplikasi.

Apabila logika digunakan lebih dari satu tempat, pindahkan ke:

- Shared Utility
- Domain Service
- Application Service

---

## 9.2 KISS (Keep It Simple)

Selalu pilih solusi yang paling sederhana selama memenuhi kebutuhan bisnis.

Kompleksitas yang tidak diperlukan hanya akan meningkatkan biaya pemeliharaan.

---

## 9.3 YAGNI (You Aren't Gonna Need It)

Jangan membuat fitur, abstraction, atau konfigurasi yang belum dibutuhkan.

Implementasikan hanya ketika terdapat kebutuhan nyata.

---

# 10. Code Readability Standards

Kode harus mudah dipahami tanpa memerlukan penjelasan tambahan.

## 10.1 Readability Checklist

Seluruh source code sebaiknya memenuhi kriteria berikut:

- Nama mudah dipahami.
- Struktur konsisten.
- Tidak ada logika tersembunyi.
- Tidak ada nested yang berlebihan.
- Tidak ada function yang terlalu panjang.
- Tidak ada class yang memiliki banyak tanggung jawab.
- Tidak ada duplikasi Business Logic.
- Mudah diuji (testable).

---

## 10.2 Golden Rules

Sebelum melakukan commit, tanyakan kepada diri sendiri:

- Apakah developer lain dapat memahami kode ini dengan cepat?
- Apakah nama class dan function sudah menjelaskan tujuannya?
- Apakah terdapat cara yang lebih sederhana?
- Apakah implementasi ini mengikuti Clean Architecture?
- Apakah saya menambahkan technical debt?

Jika jawaban terhadap salah satu pertanyaan di atas adalah **tidak**, maka kode sebaiknya diperbaiki sebelum diajukan untuk Code Review.

---

# Summary Part 1

Part 1 mendefinisikan filosofi dan prinsip dasar Coding Standard Parakita, mulai dari tujuan, ruang lingkup, filosofi penulisan kode, prinsip Clean Code, implementasi SOLID, penerapan DRY/KISS/YAGNI, hingga standar keterbacaan kode.

Seluruh aturan pada bagian berikutnya akan mengacu pada prinsip-prinsip ini untuk memastikan implementasi Backend, Frontend, dan Shared Library tetap konsisten, mudah dipelihara, mudah diuji, serta selaras dengan arsitektur **Clean Architecture**, **Domain Driven Design (DDD)**, dan **Modular Monolith**.



# Parakita Software Architecture Document (SAD)

# 05 - Coding Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 05 - Coding Standard |
| Part | 2 of 4 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Software Architecture Document (SAD) |
| Backend | Express.js + TypeScript |
| Frontend | Next.js + TypeScript |
| Last Updated | July 2026 |

---

# Table of Contents (Part 2)

11. Backend Coding Standard
12. Controller Standard
13. Use Case Standard
14. Repository Standard
15. Domain Entity Standard
16. DTO Standard
17. Validation Standard
18. Error Handling Standard
19. Logging Standard

---

# 11. Backend Coding Standard

## 11.1 Overview

Seluruh implementasi Backend wajib mengikuti prinsip:

- Clean Architecture
- SOLID
- Domain Driven Design
- Repository Pattern
- Dependency Injection

Business Logic harus berada pada **Application** dan **Domain Layer**.

Controller hanya bertindak sebagai adapter HTTP.

---

## 11.2 Directory Responsibility

| Folder | Responsibility |
|---------|----------------|
| presentation | HTTP Layer |
| application | Use Case |
| domain | Business Rule |
| infrastructure | Database & External Service |

---

## 11.3 One File One Responsibility

Setiap file hanya memiliki satu tanggung jawab.

Contoh:

```text
create-patient.usecase.ts
```

Berisi hanya implementasi Create Patient.

Tidak diperbolehkan menangani Update atau Delete.

---

# 12. Controller Standard

## 12.1 Responsibility

Controller hanya bertanggung jawab untuk:

- menerima request
- membaca parameter
- membaca query
- membaca body
- memanggil Use Case
- mengembalikan response

Controller tidak boleh:

- query database
- membuat transaksi
- melakukan perhitungan bisnis
- mengakses Prisma secara langsung

---

## 12.2 Naming Convention

Gunakan suffix berikut.

```text
PatientController

ReservationController

InvoiceController
```

---

## 12.3 Method Naming

```text
create()

update()

delete()

findById()

findAll()

checkIn()

finishVisit()
```

Gunakan kata kerja yang jelas dan konsisten.

---

## 12.4 Example

```ts
export class PatientController {
  constructor(
    private readonly createPatientUseCase: CreatePatientUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const result = await this.createPatientUseCase.execute(req.body);

    return res.status(201).json(result);
  }
}
```

---

# 13. Use Case Standard

## 13.1 Overview

Setiap proses bisnis direpresentasikan oleh satu Use Case.

Satu Use Case hanya menangani satu Business Capability.

---

## 13.2 Naming

```text
CreatePatientUseCase

UpdatePatientUseCase

RegisterReservationUseCase

CompletePaymentUseCase
```

---

## 13.3 Standard Structure

```text
create-patient/

├── create-patient.usecase.ts
├── create-patient.request.ts
└── create-patient.response.ts
```

---

## 13.4 Rules

Use Case boleh:

- memanggil Repository
- menjalankan Domain Rule
- membuat Transaction
- publish Domain Event

Use Case tidak boleh:

- mengetahui Express
- mengetahui Prisma
- mengakses HTTP Request

---

## 13.5 Example

```ts
export class CreatePatientUseCase {
  constructor(
    private readonly repository: PatientRepository,
  ) {}

  async execute(request: CreatePatientRequest) {
    // Business Logic
  }
}
```

---

# 14. Repository Standard

## 14.1 Overview

Repository menjadi abstraction terhadap database.

Semua akses persistence harus melalui Repository.

---

## 14.2 Naming

```text
IPatientRepository

PatientRepository
```

---

## 14.3 Allowed Responsibility

Repository hanya boleh:

- find
- insert
- update
- delete
- pagination
- transaction helper

---

## 14.4 Forbidden Responsibility

Repository tidak boleh:

- Business Rule
- Authentication
- Authorization
- Response Mapping

---

## 14.5 Example

```ts
interface IPatientRepository {
  findById(id: string): Promise<Patient | null>;

  save(patient: Patient): Promise<void>;
}
```

---

# 15. Domain Entity Standard

## 15.1 Purpose

Entity merepresentasikan objek bisnis.

Entity adalah pusat Business Rule.

---

## 15.2 Rules

Entity:

- tidak mengetahui database
- tidak mengetahui HTTP
- tidak mengetahui ORM
- tidak mengetahui Express

---

## 15.3 Example

```ts
export class Patient {
  constructor(
    public readonly id: string,
    public name: string,
  ) {}

  rename(name: string) {
    this.name = name;
  }
}
```

---

# 16. DTO Standard

## 16.1 DTO Type

Gunakan pemisahan DTO berikut.

```text
Request DTO

Response DTO

Event DTO

Internal DTO
```

---

## 16.2 Naming

```text
CreatePatientRequest

UpdatePatientRequest

PatientResponse

PatientSummaryResponse
```

---

## 16.3 Rules

DTO harus:

- immutable
- serializable
- tanpa Business Logic

---

# 17. Validation Standard

## 17.1 Validation Layer

Validation dilakukan secara bertingkat.

```text
HTTP Validation

↓

Business Validation

↓

Database Validation
```

---

## 17.2 Responsibility

| Validation | Layer |
|------------|-------|
| Required Field | Presentation |
| Format | Presentation |
| Business Rule | Application |
| Domain Rule | Domain |
| Database Constraint | Infrastructure |

---

## 17.3 Best Practice

Validasi sederhana dilakukan pada DTO.

Validasi bisnis dilakukan pada Use Case.

---

# 18. Error Handling Standard

## 18.1 Principle

Gunakan Custom Exception.

Hindari melempar Error secara langsung.

---

## 18.2 Example

```ts
throw new PatientNotFoundException(patientId);
```

---

## 18.3 HTTP Mapping

| Exception | HTTP Status |
|------------|------------|
| ValidationException | 400 |
| UnauthorizedException | 401 |
| ForbiddenException | 403 |
| NotFoundException | 404 |
| ConflictException | 409 |
| BusinessException | 422 |
| InternalException | 500 |

---

# 19. Logging Standard

## 19.1 Principle

Gunakan Logger terpusat.

Seluruh log harus memiliki:

- timestamp
- level
- module
- correlationId
- message

---

## 19.2 Log Level

| Level | Usage |
|---------|-------------------------|
| DEBUG | Development |
| INFO | Business Process |
| WARN | Recoverable Error |
| ERROR | Application Error |

---

## 19.3 Best Practice

Jangan pernah melakukan logging terhadap:

- Password
- JWT Token
- Refresh Token
- OTP
- Data sensitif pasien

Gunakan masking apabila diperlukan.

---

# Summary Part 2

Part 2 mendefinisikan standar implementasi Backend pada Parakita, meliputi Controller, Use Case, Repository, Domain Entity, DTO, Validation, Error Handling, dan Logging.

Standar ini memastikan seluruh implementasi backend konsisten dengan prinsip **Clean Architecture**, **Domain Driven Design (DDD)**, dan **Modular Monolith**, sehingga kode mudah dipelihara, mudah diuji, dan siap berkembang seiring pertumbuhan sistem.

# Parakita Software Architecture Document (SAD)

# 05 - Coding Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 05 - Coding Standard |
| Part | 3 of 4 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Software Architecture Document (SAD) |
| Frontend | Next.js + TypeScript |
| UI Library | Tailwind CSS + Shadcn/UI |
| State Management | TanStack Query |
| Last Updated | July 2026 |

---

# Table of Contents (Part 3)

20. Frontend Coding Standard
21. Component Standard
22. Page Standard
23. Hooks Standard
24. API Client Standard
25. State Management Standard
26. Form Standard
27. Styling Standard
28. File Naming Convention
29. Import & Export Convention
30. Frontend Best Practices

---

# 20. Frontend Coding Standard

## 20.1 Overview

Frontend Parakita dikembangkan menggunakan **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Shadcn/UI**, dan **TanStack Query**.

Seluruh implementasi frontend harus mengutamakan:

- Readability
- Reusability
- Maintainability
- Accessibility
- Performance
- Type Safety

---

## 20.2 Principles

Seluruh komponen wajib mengikuti prinsip berikut.

- Single Responsibility
- Composition over Inheritance
- Reusable Component
- Stateless Component jika memungkinkan
- Type Safe
- Separation of Concerns

---

## 20.3 Folder Responsibility

| Folder | Responsibility |
|---------|----------------|
| app | Routing |
| components | Shared Component |
| features | Business Module |
| hooks | Custom Hooks |
| services | API Client |
| lib | Utilities |
| types | Global Type |
| constants | Application Constant |

---

# 21. Component Standard

## 21.1 Component Classification

Komponen dibagi menjadi beberapa kategori.

```text
components/

├── ui/
├── common/
├── layout/
├── form/
├── table/
├── dialog/
└── feedback/
```

---

## 21.2 Naming Convention

Gunakan PascalCase.

Benar

```text
PatientCard.tsx

PatientTable.tsx

InvoiceSummary.tsx
```

Salah

```text
patientCard.tsx

patient_table.tsx

invoice-summary.tsx
```

---

## 21.3 Component Structure

```tsx
interface PatientCardProps {
  patientName: string;
}

export function PatientCard({
  patientName,
}: PatientCardProps) {
  return (
    <div>{patientName}</div>
  );
}
```

---

## 21.4 Rules

Component harus:

- reusable
- mudah diuji
- tidak mengandung Business Logic
- memiliki props yang jelas

---

## 21.5 Do & Don't

### Do

✔ Gunakan Functional Component

✔ Gunakan TypeScript Interface

✔ Gunakan Composition

---

### Don't

✖ Class Component

✖ Any Type

✖ Logic berlebihan di JSX

---

# 22. Page Standard

## 22.1 Responsibility

Page bertugas:

- menyusun layout
- memanggil hooks
- menghubungkan component
- mengatur metadata

Business Logic tidak ditulis pada Page.

---

## 22.2 Standard Structure

```text
app/

patients/

page.tsx
```

---

## 22.3 Example

```tsx
export default function PatientPage() {
  return (
    <PatientList />
  );
}
```

---

## 22.4 Rules

Page tidak boleh:

- memanggil fetch secara langsung
- menghitung Business Rule
- mengandung query SQL
- mengakses Local Storage secara langsung

---

# 23. Hooks Standard

## 23.1 Overview

Seluruh reusable logic harus dipindahkan ke Custom Hook.

---

## 23.2 Naming

Gunakan prefix:

```text
usePatient()

useReservation()

useInvoice()

useAuth()
```

---

## 23.3 Rules

Hook boleh:

- memanggil API
- menggunakan TanStack Query
- mengelola State

Hook tidak boleh:

- melakukan rendering
- mengembalikan JSX

---

## 23.4 Example

```tsx
export function usePatient() {
    return useQuery({
        queryKey: ["patients"],
        queryFn: getPatients,
    });
}
```

---

# 24. API Client Standard

## 24.1 Principle

Seluruh komunikasi API dilakukan melalui API Client.

Komponen tidak boleh memanggil Axios secara langsung.

---

## 24.2 Structure

```text
services/

patient.service.ts

reservation.service.ts

invoice.service.ts
```

---

## 24.3 Example

```ts
export const PatientService = {
    getAll() {},
    create() {},
    update() {},
    delete() {},
};
```

---

## 24.4 Rules

API Client bertanggung jawab:

- HTTP Request
- HTTP Response
- Error Mapping

Tidak bertanggung jawab terhadap:

- UI
- Toast
- Routing

---

# 25. State Management Standard

## 25.1 Overview

Gunakan state sesuai kebutuhannya.

| State | Solution |
|--------|----------|
| Server State | TanStack Query |
| Form State | React Hook Form |
| Local State | useState |
| Global UI State | Context / Zustand (jika diperlukan) |

---

## 25.2 Rules

Prioritaskan:

1. Local State
2. Context
3. Global Store

Gunakan Global State hanya jika benar-benar diperlukan.

---

## 25.3 Query Key

Gunakan format konsisten.

```text
["patients"]

["patient", id]

["reservation"]

["invoice"]
```

---

# 26. Form Standard

## 26.1 Standard Library

Seluruh form menggunakan:

- React Hook Form
- Zod

---

## 26.2 Validation

Validation dilakukan menggunakan schema.

```ts
const schema = z.object({
    patientName: z.string().min(3),
});
```

---

## 26.3 Rules

Form harus:

- controlled
- type safe
- reusable
- memiliki loading state
- memiliki error state

---

## 26.4 Error Message

Seluruh error ditampilkan dekat field yang bersangkutan.

Jangan menggunakan alert browser.

---

# 27. Styling Standard

## 27.1 Standard

Gunakan:

- Tailwind CSS
- Shadcn/UI

---

## 27.2 Rules

Prioritas styling:

1. Utility Class
2. Reusable Component
3. CSS Module (jika diperlukan)

---

## 27.3 Avoid

Hindari:

- Inline Style
- Hardcoded Color
- !important

---

## 27.4 Responsive

Gunakan breakpoint Tailwind.

```text
sm

md

lg

xl

2xl
```

---

# 28. File Naming Convention

## 28.1 File Name

Gunakan **kebab-case**.

```text
patient-table.tsx

reservation-dialog.tsx

invoice-summary.tsx
```

---

## 28.2 Component Name

Gunakan PascalCase.

```tsx
PatientTable

InvoiceSummary

ReservationDialog
```

---

## 28.3 Hook Name

Gunakan camelCase dengan prefix `use`.

```text
usePatient

useInvoice

useReservation
```

---

## 28.4 Constant

Gunakan UPPER_SNAKE_CASE.

```text
DEFAULT_PAGE_SIZE

MAX_UPLOAD_SIZE

API_TIMEOUT
```

---

# 29. Import & Export Convention

## 29.1 Import Order

Urutan import wajib sebagai berikut.

```text
1. React

2. Next.js

3. Third Party Library

4. Shared Library

5. Components

6. Hooks

7. Services

8. Types

9. Relative Import
```

---

## 29.2 Export

Gunakan Named Export.

Benar

```ts
export function PatientCard() {}
```

Hindari

```ts
export default PatientCard;
```

Kecuali untuk file `page.tsx`, `layout.tsx`, dan `loading.tsx` yang mengikuti konvensi Next.js.

---

# 30. Frontend Best Practices

## 30.1 Performance

- Gunakan Lazy Loading bila diperlukan.
- Gunakan Suspense.
- Hindari re-render yang tidak perlu.
- Memoisasi komponen mahal menggunakan `React.memo`.
- Gunakan `useMemo` dan `useCallback` hanya jika memberikan manfaat nyata.

---

## 30.2 Accessibility

Seluruh komponen harus:

- memiliki semantic HTML
- memiliki label pada form
- mendukung keyboard navigation
- memiliki ARIA attribute bila diperlukan

---

## 30.3 Error Handling

Seluruh halaman harus memiliki:

- Loading State
- Empty State
- Error State

---

## 30.4 Code Review Checklist

Pastikan setiap Pull Request memenuhi:

- Tidak ada TypeScript Error
- Tidak ada ESLint Error
- Tidak menggunakan `any`
- Tidak ada duplicate code
- Tidak ada hardcoded value
- Menggunakan reusable component
- Menggunakan custom hook jika logic digunakan lebih dari satu tempat
- Mengikuti struktur folder yang telah ditentukan
- Menggunakan naming convention yang konsisten

---

# Summary Part 3

Part 3 mendefinisikan standar implementasi Frontend pada Parakita menggunakan **Next.js**, **TypeScript**, **Tailwind CSS**, **Shadcn/UI**, dan **TanStack Query**. Standar ini mencakup struktur komponen, halaman, custom hook, API client, state management, form, styling, penamaan file, konvensi import/export, serta praktik terbaik dalam pengembangan antarmuka.

Dengan mengikuti standar ini, seluruh kode frontend akan memiliki konsistensi tinggi, mudah dipelihara, mudah diuji, dan selaras dengan prinsip **Clean Architecture**, **Domain Driven Design (DDD)**, dan **Modular Monolith** yang menjadi fondasi arsitektur Parakita.


# Parakita Software Architecture Document (SAD)

# 05 - Coding Standard

| Document Information | |
|----------------------|----------------------------------------------|
| Project | Parakita - Dental Clinic Management System |
| Document | 05 - Coding Standard |
| Part | 4 of 4 |
| Version | 1.0.0 |
| Status | Draft |
| Document Type | Software Architecture Document (SAD) |
| Backend | Express.js + TypeScript |
| Frontend | Next.js + TypeScript |
| Last Updated | July 2026 |

---

# Table of Contents (Part 4)

31. Testing Standard
32. Git Workflow Standard
33. Code Review Guideline
34. Documentation Standard
35. Security Coding Standard
36. Performance Guideline
37. Technical Debt Management
38. Deprecation Policy
39. Code Quality Checklist
40. Anti Pattern
41. Definition of Done
42. Coding Standard Summary

---

# 31. Testing Standard

## 31.1 Overview

Seluruh kode yang dikembangkan harus dapat diuji secara otomatis untuk menjamin kualitas aplikasi.

Strategi testing mengikuti konsep **Testing Pyramid**.

```text
           E2E Test
        ----------------
        Integration Test
    ------------------------
          Unit Test
```

Semakin ke bawah jumlah test semakin banyak.

---

## 31.2 Testing Level

| Testing | Purpose |
|----------|-------------------------------|
| Unit Test | Menguji Business Logic |
| Integration Test | Menguji antar Layer |
| API Test | Menguji Endpoint |
| E2E Test | Menguji User Flow |

---

## 31.3 Unit Test Rules

Unit Test wajib dilakukan pada:

- Domain Service
- Use Case
- Utility
- Mapper
- Validator

Tidak perlu melakukan Unit Test terhadap:

- DTO
- Constant
- Interface
- Configuration

---

## 31.4 Coverage Target

| Module | Minimum Coverage |
|----------|----------------|
| Domain | 90% |
| Application | 85% |
| Infrastructure | 70% |
| Presentation | 70% |
| Overall Project | ≥ 80% |

---

## 31.5 Testing Principles

- Arrange
- Act
- Assert

Contoh struktur:

```text
Arrange

↓

Act

↓

Assert
```

---

# 32. Git Workflow Standard

## 32.1 Branch Strategy

Gunakan pendekatan **Git Flow** yang disederhanakan.

```text
main

develop

feature/*

release/*

hotfix/*
```

---

## 32.2 Branch Naming

Gunakan format berikut.

```text
feature/patient-registration

feature/emr-treatment

feature/payment

bugfix/invoice-rounding

hotfix/login-error

release/v1.0.0
```

---

## 32.3 Commit Message Convention

Menggunakan **Conventional Commit**.

```text
feat:

fix:

refactor:

style:

docs:

test:

perf:

build:

ci:

chore:
```

Contoh:

```text
feat(patient): add patient registration

fix(invoice): correct total calculation

docs(api): update patient endpoint

refactor(emr): simplify treatment validation
```

---

## 32.4 Pull Request Rules

Setiap Pull Request harus:

- melalui Code Review
- lulus CI Pipeline
- bebas konflik
- memiliki deskripsi perubahan
- terkait dengan Issue atau Task

---

# 33. Code Review Guideline

## 33.1 Purpose

Code Review bertujuan memastikan:

- kualitas kode
- konsistensi
- keamanan
- maintainability

---

## 33.2 Review Checklist

Reviewer harus memastikan:

- Architecture sesuai
- SOLID diterapkan
- Clean Architecture dipatuhi
- Tidak ada duplicate code
- Tidak ada hardcoded value
- Tidak ada security issue
- Error Handling benar
- Logging sesuai standar

---

## 33.3 Review Focus

Prioritas review:

1. Correctness
2. Security
3. Architecture
4. Maintainability
5. Performance
6. Readability

---

## 33.4 Merge Rule

Kode tidak boleh di-merge apabila:

- CI gagal
- Review belum disetujui
- Coverage turun di bawah standar
- Masih terdapat blocker issue

---

# 34. Documentation Standard

## 34.1 Purpose

Dokumentasi harus selalu diperbarui seiring perubahan kode.

---

## 34.2 Required Documentation

Setiap module minimal memiliki:

```text
README.md

API Documentation

Sequence Diagram (jika kompleks)

Database Migration

Architecture Decision (jika diperlukan)
```

---

## 34.3 Code Documentation

Komentar hanya digunakan apabila logika sulit dipahami.

Gunakan nama variabel dan fungsi yang deskriptif agar kode menjadi dokumentasi utama.

---

## 34.4 TODO Convention

Gunakan format:

```text
TODO:

FIXME:

NOTE:
```

Contoh:

```ts
// TODO: Implement multi-branch validation
```

---

# 35. Security Coding Standard

## 35.1 General Principle

Keamanan merupakan tanggung jawab seluruh developer.

---

## 35.2 Sensitive Data

Jangan pernah menyimpan:

- Password Plain Text
- JWT
- Refresh Token
- OTP
- API Secret
- Access Key

ke dalam:

- source code
- log
- repository Git

---

## 35.3 Input Validation

Seluruh input wajib divalidasi.

Meliputi:

- Body
- Query
- Params
- Header

---

## 35.4 SQL Injection

Gunakan ORM (Prisma) dan parameter binding.

Jangan membuat query SQL dengan string concatenation.

---

## 35.5 Authentication

- Gunakan JWT
- Gunakan Refresh Token
- Gunakan HTTPS
- Gunakan Password Hash

---

## 35.6 Authorization

Seluruh endpoint harus memeriksa:

- Authentication
- Role
- Permission

---

# 36. Performance Guideline

## 36.1 Backend

Optimalkan:

- Pagination
- Index Database
- Query Selection
- Batch Operation

---

## 36.2 Frontend

Optimalkan:

- Lazy Loading
- Code Splitting
- Image Optimization
- Memoization bila diperlukan

---

## 36.3 API

Target performa:

| Metric | Target |
|----------|---------|
| API Response | < 500 ms |
| Authentication | < 300 ms |
| Search | < 800 ms |
| Dashboard | < 2 s |

---

# 37. Technical Debt Management

## 37.1 Principle

Technical Debt harus:

- dicatat
- diprioritaskan
- diselesaikan secara bertahap

---

## 37.2 Classification

| Level | Description |
|---------|----------------------|
| Low | Cosmetic |
| Medium | Maintainability |
| High | Performance |
| Critical | Security / Stability |

---

## 37.3 Rules

Technical Debt tidak boleh:

- mengorbankan keamanan
- melanggar arsitektur
- menyebabkan duplicate logic

---

# 38. Deprecation Policy

## 38.1 Purpose

Perubahan API harus tetap menjaga kompatibilitas.

---

## 38.2 Rules

API yang akan dihapus harus:

- diberi status Deprecated
- didokumentasikan
- memiliki masa transisi
- diinformasikan kepada seluruh tim

---

## 38.3 Versioning

Gunakan Semantic Versioning.

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
1.0.0

1.1.0

1.1.1

2.0.0
```

---

# 39. Code Quality Checklist

Checklist sebelum merge.

## Backend

- Clean Architecture
- SOLID
- Repository Pattern
- Unit Test
- Error Handling
- Logging
- DTO
- Validation

---

## Frontend

- Type Safe
- Responsive
- Accessibility
- Loading State
- Error State
- Empty State
- TanStack Query
- React Hook Form

---

## General

- ESLint Passed
- Type Check Passed
- Build Success
- Test Passed
- Documentation Updated

---

# 40. Anti Pattern

Seluruh developer harus menghindari praktik berikut.

## Backend

✖ Fat Controller

✖ Fat Repository

✖ Business Logic di Controller

✖ Query Database pada Controller

✖ Circular Dependency

✖ God Service

✖ Static Global State

---

## Frontend

✖ Inline Business Logic

✖ Deep Prop Drilling

✖ Duplicate Component

✖ Hardcoded API URL

✖ Hardcoded Color

✖ Multiple Source of Truth

---

## General

✖ Copy Paste Programming

✖ Magic Number

✖ Magic String

✖ Long Function

✖ Long Parameter List

✖ Dead Code

✖ Commented Code

---

# 41. Definition of Done

Sebuah fitur dinyatakan selesai apabila memenuhi seluruh kriteria berikut.

- Requirement selesai diimplementasikan.
- Mengikuti Clean Architecture.
- Mengikuti Coding Standard.
- Unit Test berhasil.
- Integration Test berhasil.
- Code Review disetujui.
- Tidak ada High Severity Bug.
- Dokumentasi diperbarui.
- Build berhasil.
- CI/CD berhasil.
- Siap untuk Deployment.

---

# 42. Coding Standard Summary

Dokumen **05 - Coding Standard** menjadi pedoman implementasi teknis seluruh source code Parakita.

Standar ini memastikan seluruh developer memiliki pola implementasi yang konsisten, mudah dipahami, mudah dipelihara, dan sesuai dengan prinsip **Clean Architecture**, **Domain Driven Design (DDD)**, serta **Modular Monolith**.

Penerapan standar ini memberikan manfaat:

- Konsistensi struktur kode
- Kemudahan onboarding developer baru
- Proses code review yang lebih cepat
- Mengurangi technical debt
- Meningkatkan kualitas perangkat lunak
- Mempermudah proses testing
- Memperkuat keamanan aplikasi
- Menyiapkan fondasi migrasi menuju Microservices di masa depan

---

# Appendix A. Recommended Tools

| Category | Recommended Tool |
|-----------|------------------|
| Language | TypeScript |
| Runtime | Node.js |
| Backend Framework | Express.js |
| Frontend Framework | Next.js |
| ORM | Prisma ORM |
| Database | MySQL |
| Validation | class-validator / Zod |
| Form | React Hook Form |
| Server State | TanStack Query |
| Styling | Tailwind CSS |
| UI Components | Shadcn/UI |
| Testing | Vitest / Jest |
| API Testing | Supertest |
| Linting | ESLint |
| Formatting | Prettier |
| Git Hooks | Husky |
| Commit Validation | Commitlint |
| Package Manager | pnpm |
| CI/CD | GitHub Actions |

---

# Appendix B. Coding Principles

Seluruh implementasi Parakita wajib mengikuti prinsip berikut:

1. Readability First
2. Simplicity Over Cleverness
3. Explicit is Better Than Implicit
4. Composition Over Inheritance
5. Small Function
6. Small Module
7. Fail Fast
8. Secure by Default
9. Testable Code
10. Consistent Code Style

---

# End of Document