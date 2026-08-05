import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import {
  CreatePatientAddressRequestDto,
  DeletePatientAddressRequestDto,
  UpdatePatientAddressRequestDto,
} from '../../src/modules/patient/application/dtos/PatientAddressRequestDto';
import { AddPatientAddressUseCase } from '../../src/modules/patient/application/use-cases/AddPatientAddressUseCase';
import { ListPatientAddressesUseCase } from '../../src/modules/patient/application/use-cases/ListPatientAddressesUseCase';
import { UpdatePatientAddressUseCase } from '../../src/modules/patient/application/use-cases/UpdatePatientAddressUseCase';
import { DeletePatientAddressUseCase } from '../../src/modules/patient/application/use-cases/DeletePatientAddressUseCase';
import { SetPrimaryPatientAddressUseCase } from '../../src/modules/patient/application/use-cases/SetPrimaryPatientAddressUseCase';
import { PatientAddressRegionValidator } from '../../src/modules/patient/application/services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../../src/modules/patient/application/mappers/PatientAddressMapper';
import { PatientAddressController } from '../../src/modules/patient/presentation/controllers/PatientAddressController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakePatientAddressRepository, FakePatientRepository } from '../fakes/patientFakes';
import {
  FakeDistrictRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../fakes/masterDataFakes';

const PROVINCE_ID = '11111111-1111-4111-8111-111111111111';
const REGENCY_ID = '22222222-2222-4222-8222-222222222222';
const DISTRICT_ID = '33333333-3333-4333-8333-333333333333';
const VILLAGE_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_DISTRICT_ID = '55555555-5555-4555-8555-555555555555';

// task-286 (Epic PE3, Patient Module Enhancement addendum): full CRUD
// cycle against a seeded region hierarchy, per the task's own Testing
// Required note.
function buildApp(auth: AuthenticatedContext | undefined) {
  const patientRepository = new FakePatientRepository();
  const patientAddressRepository = new FakePatientAddressRepository();

  const provinceRepository = new FakeProvinceRepository();
  provinceRepository.items = [{ id: PROVINCE_ID, provinceCode: 'DKI', provinceName: 'DKI Jakarta', isActive: true }];
  const regencyRepository = new FakeRegencyRepository();
  regencyRepository.items = [{ id: REGENCY_ID, provinceId: PROVINCE_ID, regencyCode: 'JKT-SEL', regencyName: 'Jakarta Selatan', isActive: true }];
  const districtRepository = new FakeDistrictRepository();
  districtRepository.items = [
    { id: DISTRICT_ID, regencyId: REGENCY_ID, districtCode: 'KBY', districtName: 'Kebayoran Baru', isActive: true },
    { id: OTHER_DISTRICT_ID, regencyId: REGENCY_ID, districtCode: 'CLD', districtName: 'Cilandak', isActive: true },
  ];
  const villageRepository = new FakeVillageRepository();
  villageRepository.items = [
    { id: VILLAGE_ID, districtId: DISTRICT_ID, villageCode: 'GNDR', villageName: 'Gandaria Utara', postalCode: '12140', isActive: true },
  ];

  const regionValidator = new PatientAddressRegionValidator(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const mapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const auditService = new FakeAuditService();

  const controller = new PatientAddressController(
    new AddPatientAddressUseCase(patientRepository, patientAddressRepository, regionValidator, mapper, auditService),
    new ListPatientAddressesUseCase(patientRepository, patientAddressRepository, mapper),
    new UpdatePatientAddressUseCase(patientAddressRepository, regionValidator, mapper, auditService),
    new DeletePatientAddressUseCase(patientAddressRepository, auditService),
    new SetPrimaryPatientAddressUseCase(patientAddressRepository, mapper, auditService),
  );

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.post(
    '/patients/:id/addresses',
    requirePermission('patient.update', auditService),
    validateBody(CreatePatientAddressRequestDto),
    controller.create,
  );
  router.get('/patients/:id/addresses', requirePermission('patient.read', auditService), controller.list);
  router.patch(
    '/patients/:id/addresses/:addressId',
    requirePermission('patient.update', auditService),
    validateBody(UpdatePatientAddressRequestDto),
    controller.update,
  );
  router.delete(
    '/patients/:id/addresses/:addressId',
    requirePermission('patient.update', auditService),
    validateBody(DeletePatientAddressRequestDto),
    controller.delete,
  );
  router.post(
    '/patients/:id/addresses/:addressId/set-primary',
    requirePermission('patient.update', auditService),
    controller.setPrimary,
  );

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, patientRepository };
}

const staffAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['patient.read', 'patient.update'],
};

async function seedPatient(patientRepository: FakePatientRepository) {
  return patientRepository.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('Patient Address routes', () => {
  it('runs a full add -> list -> update -> set-primary -> delete cycle', async () => {
    const { app, patientRepository } = buildApp(staffAuth);
    const patient = await seedPatient(patientRepository);

    const createFirst = await request(app).post(`/api/v1/patients/${patient.id}/addresses`).send({
      provinceId: PROVINCE_ID,
      regencyId: REGENCY_ID,
      districtId: DISTRICT_ID,
      villageId: VILLAGE_ID,
      addressLine: 'Jl. Gandaria I No. 10',
    });
    expect(createFirst.status).toBe(201);
    expect(createFirst.body.data.isPrimary).toBe(true);
    expect(createFirst.body.data.province.name).toBe('DKI Jakarta');
    const firstId = createFirst.body.data.id;

    const createSecond = await request(app).post(`/api/v1/patients/${patient.id}/addresses`).send({
      provinceId: PROVINCE_ID,
      regencyId: REGENCY_ID,
      districtId: DISTRICT_ID,
      villageId: VILLAGE_ID,
      addressLine: 'Jl. Gandaria II No. 20',
    });
    expect(createSecond.status).toBe(201);
    expect(createSecond.body.data.isPrimary).toBe(false);
    const secondId = createSecond.body.data.id;

    const listResponse = await request(app).get(`/api/v1/patients/${patient.id}/addresses`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(2);

    const updateResponse = await request(app)
      .patch(`/api/v1/patients/${patient.id}/addresses/${secondId}`)
      .send({ addressLine: 'Jl. Gandaria II No. 21' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.addressLine).toBe('Jl. Gandaria II No. 21');

    const setPrimaryResponse = await request(app).post(`/api/v1/patients/${patient.id}/addresses/${secondId}/set-primary`);
    expect(setPrimaryResponse.status).toBe(200);
    expect(setPrimaryResponse.body.data.isPrimary).toBe(true);

    const deleteWithoutReplacement = await request(app).delete(`/api/v1/patients/${patient.id}/addresses/${secondId}`);
    expect(deleteWithoutReplacement.status).toBe(422);
    expect(deleteWithoutReplacement.body.code).toBe('PATIENT_ADDRESS_PRIMARY_REQUIRED');

    const deleteWithReplacement = await request(app)
      .delete(`/api/v1/patients/${patient.id}/addresses/${secondId}`)
      .send({ newPrimaryAddressId: firstId });
    expect(deleteWithReplacement.status).toBe(200);

    const finalList = await request(app).get(`/api/v1/patients/${patient.id}/addresses`);
    expect(finalList.body.data).toHaveLength(1);
    expect(finalList.body.data[0].id).toBe(firstId);
    expect(finalList.body.data[0].isPrimary).toBe(true);
  });

  it('rejects a villageId that does not belong to the given districtId with 422', async () => {
    const { app, patientRepository } = buildApp(staffAuth);
    const patient = await seedPatient(patientRepository);

    const response = await request(app).post(`/api/v1/patients/${patient.id}/addresses`).send({
      provinceId: PROVINCE_ID,
      regencyId: REGENCY_ID,
      districtId: OTHER_DISTRICT_ID,
      villageId: VILLAGE_ID,
      addressLine: 'Jl. Salah Kecamatan',
    });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('PATIENT_ADDRESS_REGION_MISMATCH');
  });

  it('rejects adding an address without patient.update permission (403)', async () => {
    const { app, patientRepository } = buildApp({ ...staffAuth, permissionKeys: ['patient.read'] });
    const patient = await seedPatient(patientRepository);

    const response = await request(app).post(`/api/v1/patients/${patient.id}/addresses`).send({
      provinceId: PROVINCE_ID,
      regencyId: REGENCY_ID,
      districtId: DISTRICT_ID,
      villageId: VILLAGE_ID,
      addressLine: 'Jl. Contoh',
    });

    expect(response.status).toBe(403);
  });

  it('returns 404 for a non-existent patient', async () => {
    const { app } = buildApp(staffAuth);

    const response = await request(app).get('/api/v1/patients/00000000-0000-4000-8000-000000000099/addresses');

    expect(response.status).toBe(404);
  });
});
