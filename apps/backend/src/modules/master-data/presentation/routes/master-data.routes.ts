import { RequestHandler, Router } from 'express';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { MasterDataCodeExistsException, MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { buildCrudUseCases } from '../../application/shared/crudUseCaseFactory';
import { buildCrudController } from '../controllers/crudControllerFactory';

import { ClinicRepository } from '../../infrastructure/repositories/ClinicRepository';
import { BranchRepository } from '../../infrastructure/repositories/BranchRepository';
import { DoctorRepository } from '../../infrastructure/repositories/DoctorRepository';
import { TreatmentCategoryRepository } from '../../infrastructure/repositories/TreatmentCategoryRepository';
import { TreatmentRepository } from '../../infrastructure/repositories/TreatmentRepository';
import { PaymentMethodRepository } from '../../infrastructure/repositories/PaymentMethodRepository';

import { CreateClinicRequestDto, UpdateClinicRequestDto } from '../../application/dtos/ClinicRequestDto';
import { CreateBranchRequestDto, UpdateBranchRequestDto } from '../../application/dtos/BranchRequestDto';
import { CreateDoctorRequestDto, UpdateDoctorRequestDto } from '../../application/dtos/DoctorRequestDto';
import { CreateTreatmentCategoryRequestDto, UpdateTreatmentCategoryRequestDto } from '../../application/dtos/TreatmentCategoryRequestDto';
import { CreateTreatmentRequestDto, UpdateTreatmentRequestDto } from '../../application/dtos/TreatmentRequestDto';
import { CreatePaymentMethodRequestDto, UpdatePaymentMethodRequestDto } from '../../application/dtos/PaymentMethodRequestDto';

/**
 * docs/06-tasks/task-021.md..task-026.md composition root. Endpoint paths
 * follow docs/04-ai-contract/04-api-contract.md's documented URL convention
 * (lowercase plural/hyphenated nouns) since docs/03-sad/11-module-master-data.md
 * does not enumerate literal paths for these entities (flagged per-task).
 * Permission codes use the `masterdata.<entity>.<action>` pattern named in
 * each task's Security Impact section (e.g. "masterdata.clinic.manage").
 */
export function buildMasterDataModule(
  auditService: IAuditService,
  userRepository: IUserRepository,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const router = Router();
  router.use(authenticate);

  // --- Clinic (task-021) ---
  const clinicRepository = new ClinicRepository();
  const clinicUseCases = buildCrudUseCases('Clinic', clinicRepository, auditService, {
    validateCreate: async (input) => {
      if (await clinicRepository.findByCode(input.clinicCode)) {
        throw new MasterDataCodeExistsException('Clinic');
      }
    },
  });
  const clinicController = buildCrudController(clinicUseCases, 'Clinic');
  router.get('/clinics', requirePermission('masterdata.clinic.read'), validateQuery(ListQueryDto), clinicController.list);
  router.post('/clinics', requirePermission('masterdata.clinic.manage'), validateBody(CreateClinicRequestDto), clinicController.create);
  router.get('/clinics/:id', requirePermission('masterdata.clinic.read'), clinicController.detail);
  router.put('/clinics/:id', requirePermission('masterdata.clinic.manage'), validateBody(UpdateClinicRequestDto), clinicController.update);

  // --- Branch (task-022) ---
  const branchRepository = new BranchRepository();
  const branchUseCases = buildCrudUseCases('Branch', branchRepository, auditService, {
    validateCreate: async (input) => {
      if (!(await clinicRepository.findById(input.clinicId))) {
        throw new MasterDataReferenceInvalidException('Referenced Clinic does not exist');
      }
      if (await branchRepository.findByCode(input.branchCode)) {
        throw new MasterDataCodeExistsException('Branch');
      }
    },
  });
  const branchController = buildCrudController(branchUseCases, 'Branch');
  router.get('/branches', requirePermission('masterdata.branch.read'), validateQuery(ListQueryDto), branchController.list);
  router.post('/branches', requirePermission('masterdata.branch.manage'), validateBody(CreateBranchRequestDto), branchController.create);
  router.get('/branches/:id', requirePermission('masterdata.branch.read'), branchController.detail);
  router.put('/branches/:id', requirePermission('masterdata.branch.manage'), validateBody(UpdateBranchRequestDto), branchController.update);

  // --- Doctor (task-023) ---
  const doctorRepository = new DoctorRepository();
  const doctorUseCases = buildCrudUseCases('Doctor', doctorRepository, auditService, {
    validateCreate: async (input) => {
      if (!(await userRepository.findById(input.userId))) {
        throw new MasterDataReferenceInvalidException('Referenced User does not exist');
      }
      if (await doctorRepository.findByUserId(input.userId)) {
        throw new MasterDataCodeExistsException('Doctor (user already linked to a doctor profile)');
      }
      if (!(await branchRepository.findById(input.branchId))) {
        throw new MasterDataReferenceInvalidException('Referenced Branch does not exist');
      }
      if (await doctorRepository.findByCode(input.doctorCode)) {
        throw new MasterDataCodeExistsException('Doctor');
      }
    },
    validateUpdate: async (_id, input) => {
      if (input.branchId && !(await branchRepository.findById(input.branchId))) {
        throw new MasterDataReferenceInvalidException('Referenced Branch does not exist');
      }
    },
  });
  const doctorController = buildCrudController(doctorUseCases, 'Doctor');
  router.get('/doctors', requirePermission('masterdata.doctor.read'), validateQuery(ListQueryDto), doctorController.list);
  router.post('/doctors', requirePermission('masterdata.doctor.manage'), validateBody(CreateDoctorRequestDto), doctorController.create);
  router.get('/doctors/:id', requirePermission('masterdata.doctor.read'), doctorController.detail);
  router.put('/doctors/:id', requirePermission('masterdata.doctor.manage'), validateBody(UpdateDoctorRequestDto), doctorController.update);

  // --- Treatment Category (task-024) ---
  const treatmentCategoryRepository = new TreatmentCategoryRepository();
  const treatmentCategoryUseCases = buildCrudUseCases('TreatmentCategory', treatmentCategoryRepository, auditService, {
    validateCreate: async (input) => {
      if (await treatmentCategoryRepository.findByCode(input.categoryCode)) {
        throw new MasterDataCodeExistsException('TreatmentCategory');
      }
    },
  });
  const treatmentCategoryController = buildCrudController(treatmentCategoryUseCases, 'TreatmentCategory');
  router.get(
    '/treatment-categories',
    requirePermission('masterdata.treatment-category.read'),
    validateQuery(ListQueryDto),
    treatmentCategoryController.list,
  );
  router.post(
    '/treatment-categories',
    requirePermission('masterdata.treatment-category.manage'),
    validateBody(CreateTreatmentCategoryRequestDto),
    treatmentCategoryController.create,
  );
  router.get('/treatment-categories/:id', requirePermission('masterdata.treatment-category.read'), treatmentCategoryController.detail);
  router.put(
    '/treatment-categories/:id',
    requirePermission('masterdata.treatment-category.manage'),
    validateBody(UpdateTreatmentCategoryRequestDto),
    treatmentCategoryController.update,
  );

  // --- Treatment (task-025) ---
  const treatmentRepository = new TreatmentRepository();
  const treatmentUseCases = buildCrudUseCases('Treatment', treatmentRepository, auditService, {
    validateCreate: async (input) => {
      if (!(await treatmentCategoryRepository.findById(input.treatmentCategoryId))) {
        throw new MasterDataReferenceInvalidException('Referenced Treatment Category does not exist');
      }
      if (await treatmentRepository.findByCode(input.treatmentCode)) {
        throw new MasterDataCodeExistsException('Treatment');
      }
    },
    validateUpdate: async (_id, input) => {
      if (input.treatmentCategoryId && !(await treatmentCategoryRepository.findById(input.treatmentCategoryId))) {
        throw new MasterDataReferenceInvalidException('Referenced Treatment Category does not exist');
      }
    },
  });
  const treatmentController = buildCrudController(treatmentUseCases, 'Treatment');
  router.get('/treatments', requirePermission('masterdata.treatment.read'), validateQuery(ListQueryDto), treatmentController.list);
  router.post('/treatments', requirePermission('masterdata.treatment.manage'), validateBody(CreateTreatmentRequestDto), treatmentController.create);
  router.get('/treatments/:id', requirePermission('masterdata.treatment.read'), treatmentController.detail);
  router.put(
    '/treatments/:id',
    requirePermission('masterdata.treatment.manage'),
    validateBody(UpdateTreatmentRequestDto),
    treatmentController.update,
  );

  // --- Payment Method (task-026) ---
  const paymentMethodRepository = new PaymentMethodRepository();
  const paymentMethodUseCases = buildCrudUseCases('PaymentMethod', paymentMethodRepository, auditService, {
    validateCreate: async (input) => {
      if (await paymentMethodRepository.findByCode(input.methodCode)) {
        throw new MasterDataCodeExistsException('PaymentMethod');
      }
    },
  });
  const paymentMethodController = buildCrudController(paymentMethodUseCases, 'PaymentMethod');
  router.get(
    '/payment-methods',
    requirePermission('masterdata.payment-method.read'),
    validateQuery(ListQueryDto),
    paymentMethodController.list,
  );
  router.post(
    '/payment-methods',
    requirePermission('masterdata.payment-method.manage'),
    validateBody(CreatePaymentMethodRequestDto),
    paymentMethodController.create,
  );
  router.get('/payment-methods/:id', requirePermission('masterdata.payment-method.read'), paymentMethodController.detail);
  router.put(
    '/payment-methods/:id',
    requirePermission('masterdata.payment-method.manage'),
    validateBody(UpdatePaymentMethodRequestDto),
    paymentMethodController.update,
  );

  return router;
}
