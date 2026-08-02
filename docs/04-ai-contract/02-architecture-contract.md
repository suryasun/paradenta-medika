# AI Contract 02 - Architecture

**ARCH-001** The system MUST use Next.js + TypeScript for frontend, Express.js + TypeScript for backend, Prisma ORM, and MySQL.

**ARCH-002** The backend MUST use Clean Architecture, Domain Driven Design, and Modular Monolith architecture.

**ARCH-003** Business domains MUST remain isolated as bounded contexts.

**ARCH-004** The system MUST use API First communication between frontend and backend.

**ARCH-005** The system MUST preserve Authentication, Master Data, Patient, Reservation, Queue, EMR, Billing, Finance, Warehouse, HR, Reporting, and System Administration modules.

**ARCH-006** Object attachments MUST target Amazon S3 or MinIO. The exact provider configuration is NOT DEFINED IN SAD.

**CLEAN-001** The backend MUST contain Presentation, Application, Domain, and Infrastructure layers.

**CLEAN-002** Dependencies MUST point inward: Presentation -> Application -> Domain; Infrastructure -> Domain.

**CLEAN-003** Domain MUST NOT depend on Express, HTTP, Prisma, ORM, database, JWT, or framework code.

**CLEAN-004** Controllers MUST handle HTTP only; use cases MUST handle business flow; repositories MUST handle persistence.

**CLEAN-005** Use cases MUST NOT parse HTTP, return Express responses, query Prisma directly, or know JWT implementation.

**CLEAN-006** Repositories MUST NOT perform business validation, authorization, HTTP parsing, or response mapping.

**DEP-001** Modules MUST NOT access another module's tables directly.

**DEP-002** Cross-module communication MUST use an Application contract, Public Interface, or documented Domain Event.

**DEP-003** Circular dependencies MUST NOT exist.

See `27-architecture-contract.md` rules `ARCH-*`, `CLEAN-*`, and `DEP-*` for the complete contract.
