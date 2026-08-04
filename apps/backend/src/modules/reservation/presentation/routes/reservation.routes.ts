import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { BranchIdExtractor } from '../../../system/infrastructure/middlewares/branchScopeGuard';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreatePatientReservationRequestDto } from '../../application/dtos/CreateReservationRequestDto';
import { UpdateReservationRequestDto } from '../../application/dtos/UpdateReservationRequestDto';
import { RescheduleReservationRequestDto } from '../../application/dtos/RescheduleReservationRequestDto';
import { CancelReservationRequestDto } from '../../application/dtos/CancelReservationRequestDto';
import { ListReservationQueryDto } from '../../application/dtos/ListReservationQueryDto';
import { DoctorAvailabilityQueryDto } from '../../application/dtos/DoctorAvailabilityQueryDto';
import { DoctorScheduleValidator } from '../../application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../application/services/ReservationNumberGenerator';
import { CreateReservationUseCase } from '../../application/use-cases/CreateReservationUseCase';
import { WalkInRegistrationUseCase } from '../../application/use-cases/WalkInRegistrationUseCase';
import { ListReservationsUseCase } from '../../application/use-cases/ListReservationsUseCase';
import { GetReservationUseCase } from '../../application/use-cases/GetReservationUseCase';
import { UpdateReservationUseCase } from '../../application/use-cases/UpdateReservationUseCase';
import { RescheduleReservationUseCase } from '../../application/use-cases/RescheduleReservationUseCase';
import { CancelReservationUseCase } from '../../application/use-cases/CancelReservationUseCase';
import { CheckInPatientUseCase } from '../../application/use-cases/CheckInPatientUseCase';
import { ReservationAnalyticsUseCase } from '../../application/use-cases/ReservationAnalyticsUseCase';
import { ReservationAnalyticsQueryDto } from '../../application/dtos/ReservationAnalyticsQueryDto';
import { GetDoctorAvailabilityUseCase } from '../../application/use-cases/GetDoctorAvailabilityUseCase';
import { GetDoctorTimeSlotsUseCase } from '../../application/use-cases/GetDoctorTimeSlotsUseCase';
import { ReservationRepository } from '../../infrastructure/repositories/ReservationRepository';
import { DoctorScheduleRepository } from '../../infrastructure/repositories/DoctorScheduleRepository';
import { ReservationTimelineRepository } from '../../infrastructure/repositories/ReservationTimelineRepository';
import { ReservationController } from '../controllers/ReservationController';
import { DoctorAvailabilityController } from '../controllers/DoctorAvailabilityController';
import { PatientRepository } from '../../../patient/infrastructure/repositories/PatientRepository';
import { DoctorRepository } from '../../../master-data/infrastructure/repositories/DoctorRepository';

/**
 * docs/06-tasks/task-002.md + task-031.md..task-036.md composition root.
 * Permission codes follow each task's literal Security Impact wording
 * where it conflicts with docs/03-sad/13-module-reservation.md Section
 * 26.2's catalog (task-031 says `reservation.read` vs the catalog's
 * `reservation.view`; task-035 says `reservation.check-in` vs `reservation.checkin`)
 * -- Task Specification outranks SAD, per document priority order.
 *
 * task-035 (Check-In) is wired here now that task-037 (Create Queue, Epic F)
 * exists; CheckInPatientUseCase publishes PatientCheckedIn, which the Queue
 * module subscribes to (see modules/queue/presentation/routes/queue.routes.ts).
 */
export function buildReservationModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
  branchScopeGuard: (getTargetBranchId: BranchIdExtractor) => RequestHandler,
): Router {
  const reservationRepository = new ReservationRepository();
  const scheduleRepository = new DoctorScheduleRepository();
  const timelineRepository = new ReservationTimelineRepository();
  const patientRepository = new PatientRepository();
  const doctorRepository = new DoctorRepository();

  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);

  const getDoctorTimeSlotsUseCase = new GetDoctorTimeSlotsUseCase(doctorRepository, scheduleRepository, reservationRepository);

  const reservationController = new ReservationController(
    new CreateReservationUseCase(
      reservationRepository,
      patientRepository,
      doctorRepository,
      scheduleValidator,
      reservationNumberGenerator,
      auditService,
      eventBus,
    ),
    new WalkInRegistrationUseCase(reservationRepository, patientRepository, doctorRepository, reservationNumberGenerator, auditService, eventBus),
    new ListReservationsUseCase(reservationRepository),
    new GetReservationUseCase(reservationRepository),
    new UpdateReservationUseCase(reservationRepository, doctorRepository, scheduleValidator, auditService, eventBus),
    new RescheduleReservationUseCase(reservationRepository, timelineRepository, scheduleValidator, auditService, eventBus),
    new CancelReservationUseCase(reservationRepository, timelineRepository, auditService, eventBus),
    new CheckInPatientUseCase(reservationRepository, timelineRepository, auditService, eventBus),
    new ReservationAnalyticsUseCase(reservationRepository),
  );

  const availabilityController = new DoctorAvailabilityController(
    new GetDoctorAvailabilityUseCase(getDoctorTimeSlotsUseCase),
    getDoctorTimeSlotsUseCase,
  );

  const router = Router();
  router.use(authenticate);

  router.get('/reservations', requirePermission('reservation.read'), validateQuery(ListReservationQueryDto), reservationController.list);
  router.post(
    '/reservations',
    requirePermission('reservation.create'),
    validateBody(CreatePatientReservationRequestDto),
    reservationController.create,
  );
  // docs/06-tasks/task-060.md: registered before /reservations/:id so
  // Express doesn't match "analytics" as the :id param.
  // docs/06-tasks/task-216.md retrofit demonstration: rejects an
  // out-of-scope branchId query filter for non-cross-branch requesters.
  router.get(
    '/reservations/analytics',
    requirePermission('reservation.analytics.read'),
    validateQuery(ReservationAnalyticsQueryDto),
    branchScopeGuard((req) => (req.query as unknown as ReservationAnalyticsQueryDto).branchId),
    reservationController.analytics,
  );
  router.get('/reservations/:id', requirePermission('reservation.read'), reservationController.detail);
  router.put(
    '/reservations/:id',
    requirePermission('reservation.update'),
    validateBody(UpdateReservationRequestDto),
    reservationController.update,
  );
  router.patch(
    '/reservations/:id/reschedule',
    requirePermission('reservation.reschedule'),
    validateBody(RescheduleReservationRequestDto),
    reservationController.reschedule,
  );
  router.patch(
    '/reservations/:id/cancel',
    requirePermission('reservation.cancel'),
    validateBody(CancelReservationRequestDto),
    reservationController.cancel,
  );
  router.patch('/reservations/:id/check-in', requirePermission('reservation.check-in'), reservationController.checkIn);

  router.get(
    '/doctors/:id/availability',
    requirePermission('reservation.read'),
    validateQuery(DoctorAvailabilityQueryDto),
    availabilityController.availability,
  );
  router.get(
    '/doctors/:id/time-slots',
    requirePermission('reservation.read'),
    validateQuery(DoctorAvailabilityQueryDto),
    availabilityController.timeSlots,
  );

  return router;
}
