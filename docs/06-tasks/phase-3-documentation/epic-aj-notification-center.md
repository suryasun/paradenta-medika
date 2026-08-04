# Epic AJ: Notification Center — Documentation (task-195–199)

---

## Documentation Reviewed

- `docs/06-tasks/task-195.md`–`task-199.md`
- `docs/03-sad/21-module-system.md` UC-SYS-005 (§4.6), §5.4, §6.2/6.3, §7.4
- `docs/06-tasks/phase-3-plan.md` Ambiguity #3 (Reminder Notification trigger conditions not enumerated)

## Task List

| Task | Name |
|---|---|
| task-195 (P1) | Notification Template (Entity/Migration, `GET/POST /system/notification-templates`) |
| task-196 (P2) | Preview Template (`POST /system/notification-templates/{templateId}/preview`) |
| task-197 (P1) | Notification (Entity/Migration, `GET /system/notifications`) |
| task-198 (P2) | Mark Read (`POST /system/notifications/{notificationId}/read`) |
| task-199 (P0) | Delivery Worker (`SendNotificationUseCase`) — internal service, no public endpoint |

## Implementation Plan

All 5 tasks shipped together in commit `84b4f1f`. Templates are versioned and immutable after publish — editing creates a new row with an incremented `version` for the same `templateKey`, mirroring `SystemParameter`'s later append-only pattern (Epic AK). A single `TemplateRenderer` service is shared by Create, Preview, and Send so all three code paths can never diverge on what counts as "safe" content.

## Files Created

- `apps/backend/src/modules/system/application/dtos/NotificationQueryDto.ts`, `NotificationTemplateRequestDto.ts`
- `apps/backend/src/modules/system/application/services/TemplateRenderer.ts`
- `apps/backend/src/modules/system/application/use-cases/CreateNotificationTemplateUseCase.ts`, `ListNotificationTemplatesUseCase.ts`, `PreviewNotificationTemplateUseCase.ts`, `ListNotificationsUseCase.ts`, `MarkNotificationReadUseCase.ts`, `SendNotificationUseCase.ts`
- `apps/backend/src/modules/system/application/use-cases/NotificationCenter.test.ts` (13 tests)
- `apps/backend/src/modules/system/domain/repositories/INotificationRepository.ts`, `INotificationTemplateRepository.ts`
- `apps/backend/src/modules/system/domain/services/INotificationProviderAdapter.ts`
- `apps/backend/src/modules/system/infrastructure/repositories/NotificationRepository.ts`, `NotificationTemplateRepository.ts`
- `apps/backend/src/modules/system/infrastructure/services/ConsoleNotificationProviderAdapter.ts` (the only provider adapter implementation — no real email/SMS/push provider integrated)
- `apps/backend/src/modules/system/presentation/controllers/NotificationController.ts`

## Files Modified

- `openapi.yaml`, `schema.prisma`, `seed.ts`, `SystemExceptions.ts`, `system.routes.ts`

## Database Changes

- `NotificationTemplate` → `system_notification_templates`: `id, templateKey, channel (enum EMAIL/SMS/IN_APP), locale, subject, body, variableSchema (Json), classification, version, isActive, createdAt, createdBy`. `@@unique([templateKey, version])`.
- `Notification` → `system_notifications`: `id, recipientUserId, templateId, channel, subject, message, status (enum QUEUED/PROCESSING/SENT/DELIVERED/FAILED/READ/CANCELLED), idempotencyKey (unique), attempts, lastError, sentAt, readAt, createdAt`. The enum has no distinct `retrying`/`dead_letter` state (unlike `BackgroundJob` in Epic AL) — "dead-lettered" is mapped onto `status=FAILED` once `attempts` reaches max, documented in a code comment rather than left as a silent schema gap.

## API Changes

| Method | Path | Permission |
|---|---|---|
| GET | `/system/notification-templates` | `system.notification-template.read` |
| POST | `/system/notification-templates` | `system.notification-template.manage` |
| POST | `.../preview` | `system.notification-template.manage` |
| GET | `/system/notifications` | `system.notification.read` |
| POST | `/system/notifications/{id}/read` | `system.notification.read` |

`SendNotificationUseCase` (task-199) has **no public route** — confirmed absent from `system.routes.ts`, with an explicit comment: *"task-199 (SendNotificationUseCase) is an internal service with no public endpoint of its own... it is not wired into this router."* `system.notification.read` is granted broadly to all seeded roles (a personal-inbox permission); template management stays Administrator-only.

## Frontend Changes

None — backend-only.

## Security Validation

- `TemplateRenderer` rejects `<script>`/`javascript:`/inline-event-handler content and any variable referenced in the body not declared in `variableSchema`, throwing `SYS_TEMPLATE_CONTENT_UNSAFE` (extrapolated code, no literal Section 6.4 entry exists) — confirmed at `SystemExceptions.ts` line 88.
- Rendering HTML-escapes substituted values for EMAIL/IN_APP.
- `GET /system/notifications` scopes strictly to `req.auth.userId`, never client-supplied.
- `MarkNotificationReadUseCase` throws `SYS_NOTIFICATION_NOT_OWNED` (`SystemExceptions.ts` line 106) when a notification belongs to a different recipient.
- Preview never creates a `Notification` row nor calls the provider adapter (confirmed by test).
- `SendNotificationUseCase` retries are caller-driven (re-invoking `execute()` with the same `idempotencyKey`) — there is **no background job-queue worker** in this codebase, the same synchronous-execution precedent as Epic AH's `CreateReportJobUseCase`. Verified in tests: exactly 3 provider calls across 4 `execute()` invocations against a failing adapter (retry-then-dead-letter sequence).
- New permissions: `system.notification-template.read/manage`, `system.notification.read` (broad grant).

## Ambiguity #3 cross-check (Reminder Notification trigger conditions)

**Confirmed still an open, documented gap.** task-199's own Definition of Done and the delivering commit both state that wiring specific reminder triggers from Reservation/Warehouse/Finance is out of scope — "a follow-up task once each module's trigger condition is confirmed." No code anywhere calls `SendNotificationUseCase` from another module; it remains dormant infrastructure, matching `phase-3-plan.md`'s own framing exactly.

## Architecture Validation

Clean layering maintained; `INotificationProviderAdapter` is a proper port with one adapter implementation (console-only, no unapproved external library added). Test coverage: `NotificationCenter.test.ts` — 13 tests (unsafe-content rejection, undeclared-variable rejection, version incrementing, preview side-effect-free rendering, missing-variable rejection, successful delivery + event publish, idempotent retry, full retry-then-dead-letter with event publish, recipient-scoped listing, not-owned/owned mark-read).
