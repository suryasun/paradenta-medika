# task-235: API Gateway Deployment

**Phase:** Phase 5 - Enterprise Platform
**Epic:** CC. API Gateway
**Feature:** CC1. Gateway Layer
**Module:** Infrastructure
**Priority:** P1 - High

---

## Business Goal

Deploy the API Gateway layer per docs/03-sad/25-security.md Section 11 API Gateway Ready Architecture, placing TLS Termination, Rate Limiting, Request Logging, and IP Filtering in front of the existing Express API — the roadmap Phase 5 'API Gateway' item, which the SAD explicitly says the API was 'dirancang agar siap berada di belakang API Gateway' (designed to be ready to sit behind one) even in the Modular Monolith stage.

## Depends On

- task-227 (Load Balancer and Health Check Setup, Phase 4)

## Required Documents

- **AI Contract:** docs/04-ai-contract/01-global-rules.md, docs/04-ai-contract/02-architecture-contract.md, docs/04-ai-contract/09-security-contract.md
- **PRD:** docs/01-prd/vision.md, docs/01-prd/product-goals.md
- **SAD:** docs/03-sad/25-security.md (Section 11 API Gateway Ready Architecture (Request Flow: Internet → API Gateway → Authentication → Authorization → Express API → Application Services; Gateway Features: TLS Termination, Rate Limiting, Request Logging, API Key (Future), IP Filtering))
- **Design:** No page-level spec exists yet (documented gap in docs/02-design/pages/overview.md) — follow CLAUDE.md frontend rules until a design spec exists.

## Required Existing Code

task-227.

## Backend Scope

- Infrastructure as Code: API Gateway configuration (Kong, or the existing Load Balancer/Reverse Proxy from Phase 4 task-227 extended, per the SAD's request-flow diagram which places the Gateway ahead of, not instead of, Authentication/Authorization) performing TLS Termination, Rate Limiting, and Request Logging per the literal Gateway Features list.
- IP Filtering rules configuration (allow/deny lists, confirmed against actual production network requirements before go-live — not invented here).
- API Key support is explicitly listed as '(Future)' in the SAD itself; this task does not implement it.

## Frontend Scope

No dedicated page in this task; backend-only per Backend Scope. Any UI consuming this endpoint is scoped to a later frontend task once docs/02-design coverage exists.

## Database Impact

None.

## API Impact

No application endpoint changes; all existing endpoints continue to be reached through the Gateway rather than directly.

## Workflow Impact

Every existing endpoint from Phase 1–4 now passes through the Gateway's rate limiting and request logging before reaching Authentication (task-013).

## Security Impact

Rate limiting protects against brute-force and abuse at the edge, ahead of application-level rate limits already noted elsewhere in the security design. Request logs must not capture sensitive payload fields (passwords, tokens) per docs/03-sad/25-security.md's broader logging rules.

## Testing Required

- Infrastructure validation: config dry-run, smoke test against a non-production environment, and a documented operational drill (failover/restore/alert-fire test as applicable) per docs/03-sad/24-deployment.md.

## Deliverables

- API Gateway IaC configuration
- Rate limiting and IP filtering policy documentation
- Smoke test confirming existing endpoints remain reachable and rate limiting triggers correctly under load

## Acceptance Criteria

Per docs/03-sad/25-security.md Section 11 (no dedicated PRD acceptance-criteria file exists for infrastructure):

- Requests exceeding the configured rate limit receive a 429 response.
- Request logs exclude sensitive fields.
- TLS termination occurs at the Gateway, not deeper in the stack.

## Definition of Done

Gateway deployed, configured, and validated with a rate-limit smoke test. API Key support explicitly deferred (SAD marks it Future).

---

## Dependency Detail

- **Blocked By:** task-227
- **Required Before:** See phase-5-plan.md Implementation Order.
- **Can Run In Parallel With:** Tasks in other Epics once own dependencies are satisfied.
