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
import {
  FakeBranchRepository,
  FakeClinicRepository,
  FakeDistrictRepository,
  FakeDoctorRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../fakes/masterDataFakes';
import { Province, Regency, District, Village } from '@prisma/client';
import { RegionController } from '../../src/modules/master-data/presentation/controllers/RegionController';
import { ListProvincesUseCase } from '../../src/modules/master-data/application/use-cases/ListProvincesUseCase';
import { ListRegenciesUseCase } from '../../src/modules/master-data/application/use-cases/ListRegenciesUseCase';
import { ListDistrictsUseCase } from '../../src/modules/master-data/application/use-cases/ListDistrictsUseCase';
import { ListVillagesUseCase } from '../../src/modules/master-data/application/use-cases/ListVillagesUseCase';
import {
  ListDistrictsQueryDto,
  ListRegenciesQueryDto,
  ListVillagesQueryDto,
} from '../../src/modules/master-data/application/dtos/RegionQueryDto';

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

function buildRegionApp(auth: AuthenticatedContext | undefined) {
  const provinceRepository = new FakeProvinceRepository();
  const regencyRepository = new FakeRegencyRepository();
  const districtRepository = new FakeDistrictRepository();
  const villageRepository = new FakeVillageRepository();

  // IDs must be real UUIDs, not readable slugs -- ListRegenciesQueryDto/
  // ListDistrictsQueryDto/ListVillagesQueryDto validate their parent-id
  // filter with @IsUUID('4'), same as every other FK query filter in this
  // codebase (e.g. ListUsersQueryDto's branchId).
  const provinceJakarta: Province = {
    id: '11111111-1111-4111-8111-111111111111',
    provinceCode: 'DKI',
    provinceName: 'DKI Jakarta',
    isActive: true,
  };
  const provinceJabar: Province = {
    id: '22222222-2222-4222-8222-222222222222',
    provinceCode: 'JABAR',
    provinceName: 'Jawa Barat',
    isActive: true,
  };
  provinceRepository.items = [provinceJakarta, provinceJabar];

  const regencyJaksel: Regency = {
    id: '33333333-3333-4333-8333-333333333333',
    provinceId: provinceJakarta.id,
    regencyCode: 'JKT-SEL',
    regencyName: 'Jakarta Selatan',
    isActive: true,
  };
  regencyRepository.items = [regencyJaksel];

  const districtKby: District = {
    id: '44444444-4444-4444-8444-444444444444',
    regencyId: regencyJaksel.id,
    districtCode: 'KBY',
    districtName: 'Kebayoran Baru',
    isActive: true,
  };
  districtRepository.items = [districtKby];

  const villageGandaria: Village = {
    id: '55555555-5555-4555-8555-555555555555',
    districtId: districtKby.id,
    villageCode: 'GNDR',
    villageName: 'Gandaria Utara',
    postalCode: '12140',
    isActive: true,
  };
  villageRepository.items = [villageGandaria];

  const regionController = new RegionController(
    new ListProvincesUseCase(provinceRepository),
    new ListRegenciesUseCase(regencyRepository),
    new ListDistrictsUseCase(districtRepository),
    new ListVillagesUseCase(villageRepository),
  );

  const auditService = new FakeAuditService();
  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get('/master-data/provinces', requirePermission('masterdata.region.read', auditService), regionController.provinces);
  router.get(
    '/master-data/regencies',
    requirePermission('masterdata.region.read', auditService),
    validateQuery(ListRegenciesQueryDto),
    regionController.regencies,
  );
  router.get(
    '/master-data/districts',
    requirePermission('masterdata.region.read', auditService),
    validateQuery(ListDistrictsQueryDto),
    regionController.districts,
  );
  router.get(
    '/master-data/villages',
    requirePermission('masterdata.region.read', auditService),
    validateQuery(ListVillagesQueryDto),
    regionController.villages,
  );

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, provinceJakarta, provinceJabar, regencyJaksel, districtKby, villageGandaria };
}

const regionAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['masterdata.region.read'],
};

describe('Region routes', () => {
  it('lists every province', async () => {
    const { app } = buildRegionApp(regionAuth);

    const response = await request(app).get('/api/v1/master-data/provinces');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it('filters regencies by provinceId', async () => {
    const { app, provinceJakarta } = buildRegionApp(regionAuth);

    const response = await request(app).get('/api/v1/master-data/regencies').query({ provinceId: provinceJakarta.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].regencyCode).toBe('JKT-SEL');
  });

  it('filters districts by regencyId, cascading from a real regency', async () => {
    const { app, regencyJaksel } = buildRegionApp(regionAuth);

    const response = await request(app).get('/api/v1/master-data/districts').query({ regencyId: regencyJaksel.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].districtCode).toBe('KBY');
  });

  it('filters villages by districtId, cascading from a real district', async () => {
    const { app, districtKby } = buildRegionApp(regionAuth);

    const response = await request(app).get('/api/v1/master-data/villages').query({ districtId: districtKby.id });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].villageCode).toBe('GNDR');
  });

  // task-285 Acceptance Criteria: "A Regency query filtered by an invalid/
  // nonexistent provinceId returns an empty list, not a 500 error" -- the
  // same read-layer convenience-filtering behavior applies at every level.
  it('returns an empty list, not an error, when regencies are filtered by a nonexistent provinceId', async () => {
    const { app } = buildRegionApp(regionAuth);

    const response = await request(app)
      .get('/api/v1/master-data/regencies')
      .query({ provinceId: '00000000-0000-4000-8000-000000000099' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('returns an empty list, not an error, when districts are filtered by a nonexistent regencyId', async () => {
    const { app } = buildRegionApp(regionAuth);

    const response = await request(app)
      .get('/api/v1/master-data/districts')
      .query({ regencyId: '00000000-0000-4000-8000-000000000099' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('returns an empty list, not an error, when villages are filtered by a nonexistent districtId', async () => {
    const { app } = buildRegionApp(regionAuth);

    const response = await request(app)
      .get('/api/v1/master-data/villages')
      .query({ districtId: '00000000-0000-4000-8000-000000000099' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  it('rejects listing provinces without masterdata.region.read (403)', async () => {
    const { app } = buildRegionApp({ ...regionAuth, permissionKeys: [] });

    const response = await request(app).get('/api/v1/master-data/provinces');

    expect(response.status).toBe(403);
  });
});
