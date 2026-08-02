# Epic I: Dashboard (Simple) — Documentation (task-059)

> Retroactive documentation, per the template in `epic-j-foundational-infrastructure.md`'s header note.

---

## Documentation Reviewed

- `docs/06-tasks/task-059.md`
- `docs/03-sad/20-module-report.md` Section 6.1 (Dashboard API, response envelope example)

## Task List

| Task | Name |
|---|---|
| task-059 | Operations Dashboard (GET /reports/dashboards/operations, simplified) |

## Implementation Plan

A deliberately narrow slice of the SAD's full Reporting module: three Phase-1-derivable metrics only (today's reservation count, today's queue counts by status, today's collected payment amount), returned inside the SAD's generic dashboard envelope (`scope`/`dataAsOf`/`freshness`/`definitionVersion`/`metrics[]`). No report jobs, exports, snapshots, or the other five dashboards (executive/clinical/finance/warehouse/hr) — explicitly out of scope per the task's own Definition of Done.

## Files Created

Backend: `apps/backend/src/modules/reports/`: `application/{dtos,use-cases}/*`, `presentation/{controllers,routes}/*`.

Frontend (built later, once frontend work was authorized): `apps/frontend/features/dashboard/{types,services,hooks,components}/*`, `apps/frontend/app/(dashboard)/dashboard/page.tsx` — plus the shared app shell built alongside it (not dashboard-specific, but first exercised here): `apps/frontend/app/(dashboard)/layout.tsx`, `components/layout/{Sidebar,Topbar}.tsx`, `components/guards/{AuthGuard,PermissionGuard}.tsx`, `components/ui/*`, `stores/auth.store.ts`, `lib/api-client.ts`, `config/{env,navigation}.ts`, `types/api.ts`.

## Files Modified

`apps/backend/src/app.ts` (mounted `buildReportsModule`). Also extended, to supply this epic's aggregate queries: `IReservationRepository`/`ReservationRepository` (`countByDate`), `IPaymentRepository`/`PaymentRepository` (`sumAmountForDate`) — `IQueueRepository.countByStatus` was reused as-is from Epic F's Queue Dashboard.

## Database Changes

None — entirely read-only aggregate queries across existing Reservation, Queue, and Payment tables.

## API Changes

| Endpoint | Permission |
|---|---|
| `GET /reports/dashboards/operations` | `report.dashboard.operations.read` |

## Frontend Changes

First and (as of this document) only fully-built frontend feature: `OperationsDashboardView` renders reservation-today, collected-today, and a 7-status queue grid as KPI cards, with Loading/Empty/Error states per the mandated UI guideline. This vertical slice (Login → protected shell → Dashboard) was built specifically to prove the frontend scaffold works end-to-end against the real backend, not because Dashboard was picked over Patient/Reservation/etc. for product reasons.

## Security Validation

- `branchId` is accepted as a direct optional query filter, not narrowed against an authorized scope — documented gap, since per-user branch assignment doesn't exist until Phase 4 (task-210+). Noted explicitly in `OperationsDashboardUseCase`'s doc comment rather than silently omitted.
- Frontend's `AuthGuard` and `PermissionGuard` are UX-only; real enforcement remains the backend's `requirePermission` middleware, per `docs/02-design/ui-guidelines.md`'s explicit warning against relying on UI hiding as a security boundary.

## Architecture Validation

- `OperationsDashboardUseCase` reads Reservation/Queue/Billing/Master-Data repositories directly (no new domain entity of its own) — appropriate for a pure read-aggregation use case with no independent business state.
- Frontend follows the mandated `UI → Feature → Service → API Client → Backend` layering (`docs/03-sad/04-project-structure.md` Section 22.3): `OperationsDashboardView` never calls `apiClient` directly, only through `dashboardService` via the `useOperationsDashboard` TanStack Query hook.
