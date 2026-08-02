# AI Contract 10 - Code Generation Rules

**AI-001** The AI Agent MUST read all files in `ai-contract/` before reading detailed SAD documents.

**AI-002** The AI Agent MUST use `27-architecture-contract.md` as the complete numbered rule reference.

**AI-003** The AI Agent MUST NOT invent missing architecture decisions. Missing values MUST be written as `NOT DEFINED IN SAD`.

**AI-004** The AI Agent MUST NOT change the technology stack, architecture style, module boundary, data ownership, API version, or security model.

**AI-005** Every generated file MUST belong to the documented project structure and owning module.

**AI-006** Business logic MUST remain in Application or Domain and MUST NOT be placed in Presentation, UI, Page, or Repository.

**AI-007** New endpoints MUST include validation, authorization, standard response envelope, error handling, logging, audit behavior, and tests required by the SAD.

**AI-008** New code MUST use the documented naming conventions and dependency direction.

**AI-009** The AI Agent MUST create tests at the level required by the changed layer.

**AI-010** The AI Agent MUST verify API, authentication, authorization, branch isolation, database ownership, security, and backward compatibility before completion.

**AI-011** The AI Agent MUST NOT silently resolve contradictions and MUST mark unresolved decisions `NOT DEFINED IN SAD`.

**AI-012** The AI Agent MUST NOT weaken or bypass audit, authorization, validation, soft-delete, transaction, or security rules.

**AI-013** The AI Agent MUST NOT add an unversioned business endpoint.

**AI-014** The AI Agent MUST report implemented rules, tests run, and unresolved `NOT DEFINED IN SAD` items.

**AI-015** A formally changed SAD MUST produce a numbered architecture-contract revision; code MUST NOT silently alter an architecture decision.

See `27-architecture-contract.md` rules `AI-*` for the complete generation gate.
