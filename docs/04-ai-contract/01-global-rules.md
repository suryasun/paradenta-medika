# AI Contract 01 - Global Rules

This directory is the first architecture contract boundary for Parakita AI code generation.

**GLOBAL-001** The AI Agent MUST read every file in `ai-contract/` before reading any SAD detail document.

**GLOBAL-002** The AI Agent MUST treat the rules in `ai-contract/` and `27-architecture-contract.md` as the architecture contract.

**GLOBAL-003** The AI Agent MUST use only decisions explicitly present in the SAD or architecture contract.

**GLOBAL-004** The AI Agent MUST write `NOT DEFINED IN SAD` when a required value is absent from the SAD.

**GLOBAL-005** The AI Agent MUST NOT invent a framework, database, ORM, storage provider, module, endpoint, table, field, role, permission, workflow state, event, environment, or deployment parameter.

**GLOBAL-006** The AI Agent MUST NOT redesign the architecture or change the technology stack.

**GLOBAL-007** The AI Agent MUST preserve Clean Architecture, Domain Driven Design, Modular Monolith, API First, Security by Design, auditability, and backward compatibility.

**GLOBAL-008** Every generated rule and implementation decision MUST use RFC2119 terminology: MUST, MUST NOT, SHOULD, SHOULD NOT, or MAY.

**GLOBAL-009** The AI Agent MUST report unresolved `NOT DEFINED IN SAD` items before implementation.

**GLOBAL-010** The AI Agent MUST validate dependency direction, naming, API envelope, authentication, authorization, database ownership, security, and tests before completion.

**GLOBAL-011** Contradictory SAD statements MUST NOT be silently resolved. The affected decision MUST be marked `NOT DEFINED IN SAD`.

**GLOBAL-012** The AI Agent MUST read `27-architecture-contract.md` when a detailed rule or rule ID is needed.

## Reading Order

1. `01-global-rules.md`
2. `02-architecture-contract.md`
3. `03-project-structure-contract.md`
4. `04-api-contract.md`
5. `05-auth-contract.md`
6. `06-database-contract.md`
7. `07-module-contract.md`
8. `08-workflow-contract.md`
9. `09-security-contract.md`
10. `10-code-generation-rules.md`
11. Relevant SAD documents

## Authority

The complete numbered rule set is maintained in [27-architecture-contract.md](../27-architecture-contract.md). These files are the AI Agent's pre-SAD reading layer and MUST remain consistent with the master contract.
