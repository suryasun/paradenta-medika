import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { buildCrudUseCases } from '../../src/modules/master-data/application/shared/crudUseCaseFactory';
import { buildCrudController } from '../../src/modules/master-data/presentation/controllers/crudControllerFactory';
import { MasterDataCodeExistsException, MasterDataReferenceInvalidException } from '../../src/modules/master-data/domain/exceptions/MasterDataExceptions';
import { CreateClinicRequestDto } from '../../src/modules/master-data/application/dtos/ClinicRequestDto';
import { CreateBranchRequestDto } from '../../src/modules/master-data/application/dtos/BranchRequestDto';
import { CreateDoctorRequestDto } from '../../src/modules/master-data/application/dtos/DoctorRequestDto';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService, FakeUserRepository, buildUser } from '../fakes/authFakes';
import { FakeBranchRepository, FakeClinicRepository, FakeDoctorRepository } from '../fakes/masterDataFakes';

function buildApp(auth: AuthenticatedContext | undefined) {
  const auditService = new FakeAuditService();
  const clinicRepository = new FakeClinicRepository();
  const branchRepository = new FakeBranchRepository();
  const doctorRepository = new FakeDoctorRepository();
  const userRepository = new FakeUserRepository();

  const clinicUseCases = buildCrudUseCases('Clinic', clinicRepository, auditService, {
    validateCreate: async (input) => {
      if (await clinicRepository.findByCode(input.clinicCode)) throw new MasterDataCodeExistsException('Clinic');
    },
  });
  const branchUseCases = buildCrudUseCases('Branch', branchRepository, auditService, {
    validateCreate: async (input) => {
      if (!(await clinicRepository.findById(input.clinicId))) throw new MasterDataReferenceInvalidException('Referenced Clinic does not exist');
      if (await branchRepository.findByCode(input.branchCode)) throw new MasterDataCodeExistsException('Branch');
    },
  });
  const doctorUseCases = buildCrudUseCases('Doctor', doctorRepository, auditService, {
    validateCreate: async (input) => {
      if (!(await userRepository.findById(input.userId))) throw new MasterDataReferenceInvalidException('Referenced User does not exist');
      if (!(await branchRepository.findById(input.branchId))) throw new MasterDataReferenceInvalidException('Referenced Branch does not exist');
      if (await doctorRepository.findByCode(input.doctorCode)) throw new MasterDataCodeExistsException('Doctor');
    },
  });

  const clinicController = buildCrudController(clinicUseCases, 'Clinic');
  const branchController = buildCrudController(branchUseCases, 'Branch');
  const doctorController = buildCrudController(doctorUseCases, 'Doctor');

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get('/clinics', requirePermission('masterdata.clinic.read', auditService), validateQuery(ListQueryDto), clinicController.list);
  router.post('/clinics', requirePermission('masterdata.clinic.manage', auditService), validateBody(CreateClinicRequestDto), clinicController.create);
  router.post('/branches', requirePermission('masterdata.branch.manage', auditService), validateBody(CreateBranchRequestDto), branchController.create);
  router.post('/doctors', requirePermission('masterdata.doctor.manage', auditService), validateBody(CreateDoctorRequestDto), doctorController.create);

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, clinicRepository, branchRepository, userRepository };
}

const adminAuth: AuthenticatedContext = {
  userId: 'admin-1',
  username: 'admin',
  sessionId: 'session-1',
  roleCodes: ['ADMINISTRATOR'],
  permissionKeys: [
    'masterdata.clinic.read',
    'masterdata.clinic.manage',
    'masterdata.branch.manage',
    'masterdata.doctor.manage',
  ],
};

describe('Master Data routes', () => {
  it('creates a Clinic and lists it back', async () => {
    const { app } = buildApp(adminAuth);

    const createResponse = await request(app).post('/api/v1/clinics').send({
      clinicCode: 'CLN01',
      clinicName: 'Parakita Dental',
      legalName: 'PT Parakita Dental Indonesia',
      taxNumber: '01.234.567.8-901.000',
      phone: '021-1234567',
      email: 'info@parakita.example',
      address: 'Jl. Sudirman No. 1',
    });
    expect(createResponse.status).toBe(201);

    const listResponse = await request(app).get('/api/v1/clinics');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it('rejects a duplicate Clinic code with 409', async () => {
    const { app } = buildApp(adminAuth);
    const payload = {
      clinicCode: 'CLN01',
      clinicName: 'Parakita Dental',
      legalName: 'PT Parakita Dental Indonesia',
      taxNumber: '01.234.567.8-901.000',
      phone: '021-1234567',
      email: 'info@parakita.example',
      address: 'Jl. Sudirman No. 1',
    };
    await request(app).post('/api/v1/clinics').send(payload);

    const response = await request(app).post('/api/v1/clinics').send(payload);

    expect(response.status).toBe(409);
  });

  it('rejects creating a user without masterdata.clinic.manage with 403', async () => {
    const { app } = buildApp({ ...adminAuth, permissionKeys: ['masterdata.clinic.read'] });

    const response = await request(app).post('/api/v1/clinics').send({
      clinicCode: 'CLN02',
      clinicName: 'X',
      legalName: 'X',
      taxNumber: '1',
      phone: '021',
      email: 'x@example.com',
      address: 'x',
    });

    expect(response.status).toBe(403);
  });

  it('a Branch cannot be created referencing a non-existent Clinic', async () => {
    const { app } = buildApp(adminAuth);

    const response = await request(app).post('/api/v1/branches').send({
      clinicId: '00000000-0000-4000-8000-000000000000',
      branchCode: 'BR01',
      branchName: 'Main Branch',
      phone: '021-1',
      email: 'branch@example.com',
      address: 'Jl. Branch',
    });

    expect(response.status).toBe(404);
  });

  it('a Doctor cannot be created with a non-existent user_id', async () => {
    const { app, clinicRepository, branchRepository } = buildApp(adminAuth);
    const clinic = await clinicRepository.create({
      clinicCode: 'CLN03',
      clinicName: 'Clinic',
      legalName: 'Legal',
      taxNumber: '1',
      phone: '021',
      email: 'c@example.com',
      address: 'addr',
    });
    const branch = await branchRepository.create({
      clinicId: clinic.id,
      branchCode: 'BR02',
      branchName: 'Branch',
      phone: '021',
      email: 'b@example.com',
      address: 'addr',
    });

    const response = await request(app).post('/api/v1/doctors').send({
      doctorCode: 'DOC01',
      userId: '00000000-0000-4000-8000-000000000001',
      branchId: branch.id,
      fullName: 'Dr. Jane Doe',
    });

    expect(response.status).toBe(404);
  });

  it('creates a Doctor linked to an existing user', async () => {
    const { app, clinicRepository, branchRepository, userRepository } = buildApp(adminAuth);
    const clinic = await clinicRepository.create({
      clinicCode: 'CLN04',
      clinicName: 'Clinic',
      legalName: 'Legal',
      taxNumber: '1',
      phone: '021',
      email: 'c@example.com',
      address: 'addr',
    });
    const branch = await branchRepository.create({
      clinicId: clinic.id,
      branchCode: 'BR03',
      branchName: 'Branch',
      phone: '021',
      email: 'b@example.com',
      address: 'addr',
    });
    const user = buildUser({ username: 'drjane' });
    userRepository.seed(user);

    const response = await request(app).post('/api/v1/doctors').send({
      doctorCode: 'DOC02',
      userId: user.id,
      branchId: branch.id,
      fullName: 'Dr. Jane Doe',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.userId).toBe(user.id);
  });
});
