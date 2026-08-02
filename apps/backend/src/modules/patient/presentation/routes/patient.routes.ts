import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreatePatientRequestDto } from '../../application/dtos/CreatePatientRequestDto';
import { UpdatePatientRequestDto } from '../../application/dtos/UpdatePatientRequestDto';
import { ListPatientQueryDto } from '../../application/dtos/ListPatientQueryDto';
import { MedicalRecordNumberGenerator } from '../../application/services/MedicalRecordNumberGenerator';
import { CreatePatientUseCase } from '../../application/use-cases/CreatePatientUseCase';
import { ListPatientsUseCase } from '../../application/use-cases/ListPatientsUseCase';
import { GetPatientUseCase } from '../../application/use-cases/GetPatientUseCase';
import { UpdatePatientUseCase } from '../../application/use-cases/UpdatePatientUseCase';
import { ArchivePatientUseCase } from '../../application/use-cases/ArchivePatientUseCase';
import { RestorePatientUseCase } from '../../application/use-cases/RestorePatientUseCase';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { PatientController } from '../controllers/PatientController';

/**
 * docs/06-tasks/task-001.md + task-027.md..task-030.md composition root.
 * Permission codes: `patient.read`/`patient.create`/`patient.update` per
 * docs/03-sad/12-module-patient.md Section 10.2; `patient.archive` per
 * task-030.md's explicit Security Impact (that task-level code is used
 * literally even though Section 10.2's catalog instead names `patient.delete`
 * for this action -- Task Specification outranks the SAD, per document
 * priority order).
 */
export function buildPatientModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const patientRepository = new PatientRepository();
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);

  const controller = new PatientController(
    new CreatePatientUseCase(patientRepository, mrnGenerator, auditService, eventBus),
    new ListPatientsUseCase(patientRepository),
    new GetPatientUseCase(patientRepository),
    new UpdatePatientUseCase(patientRepository, auditService, eventBus),
    new ArchivePatientUseCase(patientRepository, auditService, eventBus),
    new RestorePatientUseCase(patientRepository, auditService, eventBus),
  );

  const router = Router();
  router.use(authenticate);

  router.get('/patients', requirePermission('patient.read'), validateQuery(ListPatientQueryDto), controller.list);
  router.post('/patients', requirePermission('patient.create'), validateBody(CreatePatientRequestDto), controller.create);
  router.get('/patients/:id', requirePermission('patient.read'), controller.detail);
  router.put('/patients/:id', requirePermission('patient.update'), validateBody(UpdatePatientRequestDto), controller.update);
  router.patch('/patients/:id/archive', requirePermission('patient.archive'), controller.archive);
  router.patch('/patients/:id/restore', requirePermission('patient.archive'), controller.restore);

  return router;
}
