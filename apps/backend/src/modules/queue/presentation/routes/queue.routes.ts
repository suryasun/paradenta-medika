import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreateQueueRequestDto } from '../../application/dtos/CreateQueueRequestDto';
import { ListQueueQueryDto } from '../../application/dtos/ListQueueQueryDto';
import { TransferQueueRequestDto } from '../../application/dtos/TransferQueueRequestDto';
import { CancelQueueRequestDto } from '../../application/dtos/CancelQueueRequestDto';
import { QueueDashboardQueryDto } from '../../application/dtos/QueueDashboardQueryDto';
import { QueueNumberGenerator } from '../../application/services/QueueNumberGenerator';
import { CreateQueueUseCase } from '../../application/use-cases/CreateQueueUseCase';
import { ListQueueUseCase } from '../../application/use-cases/ListQueueUseCase';
import { GetQueueDetailUseCase } from '../../application/use-cases/GetQueueDetailUseCase';
import { CallQueueUseCase } from '../../application/use-cases/CallQueueUseCase';
import { RecallQueueUseCase } from '../../application/use-cases/RecallQueueUseCase';
import { SkipQueueUseCase } from '../../application/use-cases/SkipQueueUseCase';
import { StartServiceUseCase } from '../../application/use-cases/StartServiceUseCase';
import { CompleteQueueUseCase } from '../../application/use-cases/CompleteQueueUseCase';
import { CancelQueueUseCase } from '../../application/use-cases/CancelQueueUseCase';
import { TransferQueueUseCase } from '../../application/use-cases/TransferQueueUseCase';
import { QueueDashboardUseCase } from '../../application/use-cases/QueueDashboardUseCase';
import { QueueRepository } from '../../infrastructure/repositories/QueueRepository';
import { QueueHistoryRepository } from '../../infrastructure/repositories/QueueHistoryRepository';
import { QueueCallRepository } from '../../infrastructure/repositories/QueueCallRepository';
import { QueueController } from '../controllers/QueueController';
import { QueueDashboardController } from '../controllers/QueueDashboardController';
import { PatientRepository } from '../../../patient/infrastructure/repositories/PatientRepository';
import { DoctorRepository } from '../../../master-data/infrastructure/repositories/DoctorRepository';
import { PATIENT_CHECKED_IN_EVENT, PatientCheckedInPayload } from '../../../reservation/domain/events/ReservationEvents';

/**
 * docs/06-tasks/task-037.md..task-047.md composition root. Permission
 * codes follow the `queue.<action>` convention named across the task docs
 * (which only give "the corresponding queue.* permission" generically,
 * not literal codes -- docs/03-sad/14-module-queue.md Section 65.3 gives
 * only a role matrix, no literal codes either). `queue.dashboard.read` is
 * the one literal code task-047.md names explicitly.
 *
 * Subscribes to PatientCheckedIn (published by
 * modules/reservation/application/use-cases/CheckInPatientUseCase) to
 * create the Queue entry, per task-035.md's documented option of using the
 * event rather than a direct cross-module use-case call.
 */
export function buildQueueModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const queueRepository = new QueueRepository();
  const historyRepository = new QueueHistoryRepository();
  const callRepository = new QueueCallRepository();
  const patientRepository = new PatientRepository();
  const doctorRepository = new DoctorRepository();
  const queueNumberGenerator = new QueueNumberGenerator(queueRepository);

  const createQueueUseCase = new CreateQueueUseCase(
    queueRepository,
    patientRepository,
    doctorRepository,
    queueNumberGenerator,
    auditService,
    eventBus,
  );

  eventBus.subscribe<PatientCheckedInPayload>(PATIENT_CHECKED_IN_EVENT, async (payload) => {
    await createQueueUseCase.execute({
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      reservationId: payload.reservationId,
      actorUserId: 'system:patient-checked-in',
    });
  });

  const queueController = new QueueController(
    createQueueUseCase,
    new ListQueueUseCase(queueRepository),
    new GetQueueDetailUseCase(queueRepository),
    new CallQueueUseCase(queueRepository, historyRepository, callRepository, auditService, eventBus),
    new RecallQueueUseCase(queueRepository, callRepository),
    new SkipQueueUseCase(queueRepository, historyRepository, auditService, eventBus),
    new StartServiceUseCase(queueRepository, historyRepository, auditService, eventBus),
    new CompleteQueueUseCase(queueRepository, historyRepository, auditService, eventBus),
    new CancelQueueUseCase(queueRepository, historyRepository, auditService, eventBus),
    new TransferQueueUseCase(queueRepository, doctorRepository, historyRepository, auditService),
  );

  const dashboardController = new QueueDashboardController(new QueueDashboardUseCase(queueRepository));

  const router = Router();
  router.use(authenticate);

  // Must be registered before "/queues/:id" so "dashboard" is not matched as an id.
  router.get('/queues/dashboard', requirePermission('queue.dashboard.read'), validateQuery(QueueDashboardQueryDto), dashboardController.dashboard);

  router.get('/queues', requirePermission('queue.read'), validateQuery(ListQueueQueryDto), queueController.list);
  router.post('/queues', requirePermission('queue.create'), validateBody(CreateQueueRequestDto), queueController.create);
  router.get('/queues/:id', requirePermission('queue.read'), queueController.detail);
  router.patch('/queues/:id/call', requirePermission('queue.call'), queueController.call);
  router.patch('/queues/:id/recall', requirePermission('queue.recall'), queueController.recall);
  router.patch('/queues/:id/skip', requirePermission('queue.skip'), validateBody(CancelQueueRequestDto), queueController.skip);
  router.patch('/queues/:id/start', requirePermission('queue.start'), queueController.start);
  router.patch('/queues/:id/complete', requirePermission('queue.complete'), queueController.complete);
  router.patch('/queues/:id/cancel', requirePermission('queue.cancel'), validateBody(CancelQueueRequestDto), queueController.cancel);
  router.patch('/queues/:id/transfer', requirePermission('queue.transfer'), validateBody(TransferQueueRequestDto), queueController.transfer);

  return router;
}
