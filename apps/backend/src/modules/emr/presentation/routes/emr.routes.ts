import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { OpenVisitRequestDto } from '../../application/dtos/OpenVisitRequestDto';
import { RecordVitalSignRequestDto } from '../../application/dtos/RecordVitalSignRequestDto';
import { RecordSoapNoteRequestDto } from '../../application/dtos/RecordSoapNoteRequestDto';
import { RecordDiagnosisRequestDto } from '../../application/dtos/RecordDiagnosisRequestDto';
import { RecordTreatmentRequestDto } from '../../application/dtos/RecordTreatmentRequestDto';
import { VisitNumberGenerator } from '../../application/services/VisitNumberGenerator';
import { OpenVisitUseCase } from '../../application/use-cases/OpenVisitUseCase';
import { GetVisitDetailUseCase } from '../../application/use-cases/GetVisitDetailUseCase';
import { RecordVitalSignUseCase } from '../../application/use-cases/RecordVitalSignUseCase';
import { RecordSoapNoteUseCase } from '../../application/use-cases/RecordSoapNoteUseCase';
import { RecordDiagnosisUseCase } from '../../application/use-cases/RecordDiagnosisUseCase';
import { RecordTreatmentUseCase } from '../../application/use-cases/RecordTreatmentUseCase';
import { CloseVisitUseCase } from '../../application/use-cases/CloseVisitUseCase';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { VitalSignRepository } from '../../infrastructure/repositories/VitalSignRepository';
import { SoapNoteRepository } from '../../infrastructure/repositories/SoapNoteRepository';
import { VisitDiagnosisRepository } from '../../infrastructure/repositories/VisitDiagnosisRepository';
import { VisitTreatmentRepository } from '../../infrastructure/repositories/VisitTreatmentRepository';
import { VisitController } from '../controllers/VisitController';
import { QueueRepository } from '../../../queue/infrastructure/repositories/QueueRepository';
import { TreatmentRepository } from '../../../master-data/infrastructure/repositories/TreatmentRepository';

/**
 * docs/06-tasks/task-048.md..task-053.md composition root. Base path
 * `/api/v1/emr/visits` follows the convention already used elsewhere in
 * docs/03-sad/15-module-emr.md (`/api/v1/emr/attachments`, `/api/v1/emr/
 * periodontal-assessments`, `/api/v1/emr/timeline/...`) -- task-048.md's
 * own citation of "Section 39" for the exact path does not correspond to
 * an OpenAPI section in this document (that section number belongs to a
 * different, Odontogram-scoped part of the concatenated doc), so the
 * established `/api/v1/emr/...` prefix was extrapolated instead of
 * inventing an unrelated one. Permission codes are the literal
 * `emr.*` codes named in each task's Security Impact section.
 */
export function buildEmrModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const visitRepository = new VisitRepository();
  const vitalSignRepository = new VitalSignRepository();
  const soapNoteRepository = new SoapNoteRepository();
  const diagnosisRepository = new VisitDiagnosisRepository();
  const visitTreatmentRepository = new VisitTreatmentRepository();
  const queueRepository = new QueueRepository();
  const treatmentRepository = new TreatmentRepository();
  const visitNumberGenerator = new VisitNumberGenerator(visitRepository);

  const controller = new VisitController(
    new OpenVisitUseCase(visitRepository, queueRepository, visitNumberGenerator, auditService),
    new GetVisitDetailUseCase(visitRepository, vitalSignRepository, soapNoteRepository, diagnosisRepository, visitTreatmentRepository),
    new RecordVitalSignUseCase(visitRepository, vitalSignRepository, auditService),
    new RecordSoapNoteUseCase(visitRepository, soapNoteRepository, auditService),
    new RecordDiagnosisUseCase(visitRepository, diagnosisRepository, auditService),
    new RecordTreatmentUseCase(visitRepository, visitTreatmentRepository, treatmentRepository, auditService),
    new CloseVisitUseCase(visitRepository, soapNoteRepository, visitTreatmentRepository, auditService, eventBus),
  );

  const router = Router();
  router.use(authenticate);

  router.post('/emr/visits', requirePermission('emr.visit.create'), validateBody(OpenVisitRequestDto), controller.open);
  router.get('/emr/visits/:id', requirePermission('emr.visit.read'), controller.detail);
  router.post(
    '/emr/visits/:id/vital-signs',
    requirePermission('emr.vital.record'),
    validateBody(RecordVitalSignRequestDto),
    controller.recordVitalSign,
  );
  router.put(
    '/emr/visits/:id/soap-note',
    requirePermission('emr.soap.record'),
    validateBody(RecordSoapNoteRequestDto),
    controller.recordSoapNote,
  );
  router.post(
    '/emr/visits/:id/diagnoses',
    requirePermission('emr.diagnosis.record'),
    validateBody(RecordDiagnosisRequestDto),
    controller.recordDiagnosis,
  );
  router.post(
    '/emr/visits/:id/treatments',
    requirePermission('emr.treatment.record'),
    validateBody(RecordTreatmentRequestDto),
    controller.recordTreatment,
  );
  router.post('/emr/visits/:id/close', requirePermission('emr.visit.close'), controller.close);

  return router;
}
