import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { CreatePatientRequestDto } from '../../application/dtos/CreatePatientRequestDto';
import { UpdatePatientRequestDto } from '../../application/dtos/UpdatePatientRequestDto';
import { QuickAddPatientRequestDto } from '../../application/dtos/QuickAddPatientRequestDto';
import { ListPatientQueryDto } from '../../application/dtos/ListPatientQueryDto';
import { MedicalRecordNumberGenerator } from '../../application/services/MedicalRecordNumberGenerator';
import { CreatePatientUseCase } from '../../application/use-cases/CreatePatientUseCase';
import { ListPatientsUseCase } from '../../application/use-cases/ListPatientsUseCase';
import { GetPatientUseCase } from '../../application/use-cases/GetPatientUseCase';
import { UpdatePatientUseCase } from '../../application/use-cases/UpdatePatientUseCase';
import { ArchivePatientUseCase } from '../../application/use-cases/ArchivePatientUseCase';
import { RestorePatientUseCase } from '../../application/use-cases/RestorePatientUseCase';
import { QuickAddPatientUseCase } from '../../application/use-cases/QuickAddPatientUseCase';
import { PatientRepository } from '../../infrastructure/repositories/PatientRepository';
import { PatientController } from '../controllers/PatientController';

import { CreatePatientAddressRequestDto, DeletePatientAddressRequestDto, UpdatePatientAddressRequestDto } from '../../application/dtos/PatientAddressRequestDto';
import { AddPatientAddressUseCase } from '../../application/use-cases/AddPatientAddressUseCase';
import { ListPatientAddressesUseCase } from '../../application/use-cases/ListPatientAddressesUseCase';
import { UpdatePatientAddressUseCase } from '../../application/use-cases/UpdatePatientAddressUseCase';
import { DeletePatientAddressUseCase } from '../../application/use-cases/DeletePatientAddressUseCase';
import { SetPrimaryPatientAddressUseCase } from '../../application/use-cases/SetPrimaryPatientAddressUseCase';
import { PatientAddressRegionValidator } from '../../application/services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../../application/mappers/PatientAddressMapper';
import { PatientAddressRepository } from '../../infrastructure/repositories/PatientAddressRepository';
import { PatientAddressController } from '../controllers/PatientAddressController';
import { ProvinceRepository } from '../../../master-data/infrastructure/repositories/ProvinceRepository';
import { RegencyRepository } from '../../../master-data/infrastructure/repositories/RegencyRepository';
import { DistrictRepository } from '../../../master-data/infrastructure/repositories/DistrictRepository';
import { VillageRepository } from '../../../master-data/infrastructure/repositories/VillageRepository';
import { ReferralSourceRepository } from '../../../master-data/infrastructure/repositories/ReferralSourceRepository';

import {
  CreatePatientEmergencyContactRequestDto,
  UpdatePatientEmergencyContactRequestDto,
} from '../../application/dtos/PatientEmergencyContactRequestDto';
import { AddEmergencyContactUseCase } from '../../application/use-cases/AddEmergencyContactUseCase';
import { ListEmergencyContactsUseCase } from '../../application/use-cases/ListEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from '../../application/use-cases/UpdateEmergencyContactUseCase';
import { DeleteEmergencyContactUseCase } from '../../application/use-cases/DeleteEmergencyContactUseCase';
import { PatientEmergencyContactRepository } from '../../infrastructure/repositories/PatientEmergencyContactRepository';
import { PatientEmergencyContactController } from '../controllers/PatientEmergencyContactController';

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
  // task-287 (Epic PE4): consumed by Create/UpdatePatientUseCase to
  // validate a submitted referralSourceId (module boundary honored).
  const referralSourceRepository = new ReferralSourceRepository();

  const controller = new PatientController(
    new CreatePatientUseCase(patientRepository, mrnGenerator, auditService, eventBus, referralSourceRepository),
    new ListPatientsUseCase(patientRepository),
    new GetPatientUseCase(patientRepository),
    new UpdatePatientUseCase(patientRepository, auditService, eventBus, referralSourceRepository),
    new ArchivePatientUseCase(patientRepository, auditService, eventBus),
    new RestorePatientUseCase(patientRepository, auditService, eventBus),
    new QuickAddPatientUseCase(patientRepository, mrnGenerator, auditService, eventBus),
  );

  const router = Router();
  router.use(authenticate);

  router.get('/patients', requirePermission('patient.read'), validateQuery(ListPatientQueryDto), controller.list);
  router.post('/patients', requirePermission('patient.create'), validateBody(CreatePatientRequestDto), controller.create);
  // task-289 (Epic PE6): gated by patient.create, same as full
  // registration -- no new permission code, per the task's own Security
  // Impact.
  router.post('/patients/quick-add', requirePermission('patient.create'), validateBody(QuickAddPatientRequestDto), controller.quickAdd);
  router.get('/patients/:id', requirePermission('patient.read'), controller.detail);
  router.put('/patients/:id', requirePermission('patient.update'), validateBody(UpdatePatientRequestDto), controller.update);
  router.patch('/patients/:id/archive', requirePermission('patient.archive'), controller.archive);
  router.patch('/patients/:id/restore', requirePermission('patient.archive'), controller.restore);

  // --- Patient Address Book (task-286, Epic PE3, Patient Module
  // Enhancement addendum). Gated by the existing patient.read/patient.update
  // permissions -- no new permission code, matching every other GET-uses-
  // .read/mutation-uses-.update split already used throughout this router
  // (the task's own Security Impact text only calls out .update explicitly
  // for "address management", i.e. the write operations). ---
  const provinceRepository = new ProvinceRepository();
  const regencyRepository = new RegencyRepository();
  const districtRepository = new DistrictRepository();
  const villageRepository = new VillageRepository();
  const patientAddressRepository = new PatientAddressRepository();
  const regionValidator = new PatientAddressRegionValidator(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const addressMapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);

  const patientAddressController = new PatientAddressController(
    new AddPatientAddressUseCase(patientRepository, patientAddressRepository, regionValidator, addressMapper, auditService),
    new ListPatientAddressesUseCase(patientRepository, patientAddressRepository, addressMapper),
    new UpdatePatientAddressUseCase(patientAddressRepository, regionValidator, addressMapper, auditService),
    new DeletePatientAddressUseCase(patientAddressRepository, auditService),
    new SetPrimaryPatientAddressUseCase(patientAddressRepository, addressMapper, auditService),
  );

  router.post(
    '/patients/:id/addresses',
    requirePermission('patient.update'),
    validateBody(CreatePatientAddressRequestDto),
    patientAddressController.create,
  );
  router.get('/patients/:id/addresses', requirePermission('patient.read'), patientAddressController.list);
  router.patch(
    '/patients/:id/addresses/:addressId',
    requirePermission('patient.update'),
    validateBody(UpdatePatientAddressRequestDto),
    patientAddressController.update,
  );
  router.delete(
    '/patients/:id/addresses/:addressId',
    requirePermission('patient.update'),
    validateBody(DeletePatientAddressRequestDto),
    patientAddressController.delete,
  );
  router.post(
    '/patients/:id/addresses/:addressId/set-primary',
    requirePermission('patient.update'),
    patientAddressController.setPrimary,
  );

  // --- Patient Emergency Contacts (task-288, Epic PE5, Patient Module
  // Enhancement addendum). Same .read/.update split as Patient Address
  // Book above -- no new permission code, per the task's own Security
  // Impact. ---
  const patientEmergencyContactRepository = new PatientEmergencyContactRepository();
  const patientEmergencyContactController = new PatientEmergencyContactController(
    new AddEmergencyContactUseCase(patientRepository, patientEmergencyContactRepository, auditService),
    new ListEmergencyContactsUseCase(patientRepository, patientEmergencyContactRepository),
    new UpdateEmergencyContactUseCase(patientEmergencyContactRepository, auditService),
    new DeleteEmergencyContactUseCase(patientEmergencyContactRepository, auditService),
  );

  router.post(
    '/patients/:id/emergency-contacts',
    requirePermission('patient.update'),
    validateBody(CreatePatientEmergencyContactRequestDto),
    patientEmergencyContactController.create,
  );
  router.get('/patients/:id/emergency-contacts', requirePermission('patient.read'), patientEmergencyContactController.list);
  router.patch(
    '/patients/:id/emergency-contacts/:contactId',
    requirePermission('patient.update'),
    validateBody(UpdatePatientEmergencyContactRequestDto),
    patientEmergencyContactController.update,
  );
  router.delete(
    '/patients/:id/emergency-contacts/:contactId',
    requirePermission('patient.update'),
    patientEmergencyContactController.delete,
  );

  return router;
}
