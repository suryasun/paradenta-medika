# AI Contract 03 - Project Structure

**STRUCT-001** The repository MUST use a monorepo with separate frontend and backend applications.

**STRUCT-002** Backend business code MUST be placed under `apps/backend/src/modules`.

**STRUCT-003** Every backend module MUST use `presentation`, `application`, `domain`, and `infrastructure` directories, with entry point and README as applicable.

**STRUCT-004** Presentation MAY contain controllers, routes, DTOs, validators, requests, responses, and middlewares.

**STRUCT-005** Application MAY contain use-cases, services, commands, queries, mappers, handlers, and events.

**STRUCT-006** Domain MAY contain entities, value objects, repositories, services, events, exceptions, interfaces, and specifications.

**STRUCT-007** Infrastructure MAY contain repositories, persistence, storage, integrations, event bus, and cache.

**STRUCT-008** Shared code MUST be reusable by more than one module and MUST NOT contain business logic.

**STRUCT-009** Frontend MUST use `app`, `features`, `components`, `hooks`, `services`, `stores`, `lib`, `styles`, `public`, `types`, `utils`, and `config` as applicable.

**STRUCT-010** Frontend features MUST separate components, pages, hooks, services, types, and utils as applicable.

**STRUCT-011** UI MUST NOT access the API directly. UI -> Feature -> Service -> API Client -> Backend.

**STRUCT-012** Build output MUST NOT be committed.

**STRUCT-013** New directories MUST NOT be created without a clear requirement.

**NAME-001** Backend classes and main files MUST use PascalCase; frontend file names MUST use kebab-case and components MUST use PascalCase.

**NAME-002** API resources MUST use lowercase plural nouns; database tables MUST use lowercase plural snake_case.

See `27-architecture-contract.md` rules `STRUCT-*` and `NAME-*` for the complete contract.
