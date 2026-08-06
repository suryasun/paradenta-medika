import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { CreatePatientRequestDto } from '../../src/modules/patient/application/dtos/CreatePatientRequestDto';
import { UpdatePatientRequestDto } from '../../src/modules/patient/application/dtos/UpdatePatientRequestDto';
import { ListPatientQueryDto } from '../../src/modules/patient/application/dtos/ListPatientQueryDto';
import { MedicalRecordNumberGenerator } from '../../src/modules/patient/application/services/MedicalRecordNumberGenerator';
import { CreatePatientUseCase } from '../../src/modules/patient/application/use-cases/CreatePatientUseCase';
import { ListPatientsUseCase } from '../../src/modules/patient/application/use-cases/ListPatientsUseCase';
import { GetPatientUseCase } from '../../src/modules/patient/application/use-cases/GetPatientUseCase';
import { UpdatePatientUseCase } from '../../src/modules/patient/application/use-cases/UpdatePatientUseCase';
import { ArchivePatientUseCase } from '../../src/modules/patient/application/use-cases/ArchivePatientUseCase';
import { RestorePatientUseCase } from '../../src/modules/patient/application/use-cases/RestorePatientUseCase';
import { PatientController } from '../../src/modules/patient/presentation/controllers/PatientController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../fakes/patientFakes';
import { FakeReferralSourceRepository } from '../fakes/masterDataFakes';

function buildApp(auth: AuthenticatedContext | undefined) {
  const patientRepository = new FakePatientRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
  const referralSourceRepository = new FakeReferralSourceRepository();

  const controller = new PatientController(
    new CreatePatientUseCase(patientRepository, mrnGenerator, auditService, eventBus, referralSourceRepository),
    new ListPatientsUseCase(patientRepository),
    new GetPatientUseCase(patientRepository),
    new UpdatePatientUseCase(patientRepository, auditService, eventBus, referralSourceRepository),
    new ArchivePatientUseCase(patientRepository, auditService, eventBus),
    new RestorePatientUseCase(patientRepository, auditService, eventBus),
  );

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get('/patients', requirePermission('patient.read', auditService), validateQuery(ListPatientQueryDto), controller.list);
  router.post('/patients', requirePermission('patient.create', auditService), validateBody(CreatePatientRequestDto), controller.create);
  router.get('/patients/:id', requirePermission('patient.read', auditService), controller.detail);
  router.put(
    '/patients/:id',
    requirePermission('patient.update', auditService),
    validateBody(UpdatePatientRequestDto),
    controller.update,
  );

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, referralSourceRepository };
}

const staffAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['patient.read', 'patient.create', 'patient.update'],
};

describe('Patient routes', () => {
  it('registers a patient end-to-end and finds it via search by keyword', async () => {
    const { app } = buildApp(staffAuth);

    const createResponse = await request(app).post('/api/v1/patients').send({
      fullName: 'John Doe',
      gender: 'MALE',
      dateOfBirth: '1998-08-10',
      phoneNumber: '08123456789',
      address: 'Jl. Contoh No. 10',
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.medicalRecordNumber).toBe('MRN000001');

    const listResponse = await request(app).get('/api/v1/patients').query({ search: 'John' });
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('round-trips the task-284 supplementary contact fields through POST and PUT', async () => {
    const { app } = buildApp(staffAuth);

    const createResponse = await request(app)
      .post('/api/v1/patients')
      .send({
        fullName: 'Jane Doe',
        gender: 'FEMALE',
        dateOfBirth: '1995-05-05',
        phoneNumber: '08129876543',
        address: 'Jl. Contoh No. 20',
        insuranceNumber: 'INS-100',
        instagramHandle: '@jane.doe',
        facebookHandle: 'jane.doe.fb',
        tiktokHandle: '@jane.tiktok',
        whatsappNumber: '08129876543',
      });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      insuranceNumber: 'INS-100',
      instagramHandle: '@jane.doe',
      facebookHandle: 'jane.doe.fb',
      tiktokHandle: '@jane.tiktok',
      whatsappNumber: '08129876543',
    });

    const patientId = createResponse.body.data.id;
    const updateResponse = await request(app).put(`/api/v1/patients/${patientId}`).send({
      insuranceNumber: 'INS-200',
      instagramHandle: '@jane.updated',
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data).toMatchObject({
      insuranceNumber: 'INS-200',
      instagramHandle: '@jane.updated',
      facebookHandle: 'jane.doe.fb',
    });
  });

  it('registers a patient without any of the task-284 supplementary contact fields (all optional)', async () => {
    const { app } = buildApp(staffAuth);

    const response = await request(app).post('/api/v1/patients').send({
      fullName: 'No Extras',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      phoneNumber: '08111222333',
      address: 'Jl. Contoh No. 30',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      insuranceNumber: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: null,
    });
  });

  it('round-trips a valid referralSourceId through POST, and rejects an invalid one with 422', async () => {
    const { app, referralSourceRepository } = buildApp(staffAuth);
    referralSourceRepository.items = [
      {
        id: '66666666-6666-4666-8666-666666666666',
        referralSourceCode: 'STAFF',
        referralSourceName: 'Staf Klinik',
        requiresReferrer: true,
        isActive: true,
      },
    ];

    const validResponse = await request(app).post('/api/v1/patients').send({
      fullName: 'Referred Patient',
      gender: 'FEMALE',
      dateOfBirth: '1992-02-02',
      phoneNumber: '08199988877',
      address: 'Jl. Contoh No. 40',
      referralSourceId: '66666666-6666-4666-8666-666666666666',
    });
    expect(validResponse.status).toBe(201);
    expect(validResponse.body.data.referralSourceId).toBe('66666666-6666-4666-8666-666666666666');
    expect(validResponse.body.data.referredByUserId).toBeNull();

    const invalidResponse = await request(app).post('/api/v1/patients').send({
      fullName: 'Bad Referral',
      gender: 'MALE',
      dateOfBirth: '1992-02-02',
      phoneNumber: '08199988866',
      address: 'Jl. Contoh No. 41',
      referralSourceId: '00000000-0000-4000-8000-000000000099',
    });
    expect(invalidResponse.status).toBe(422);
    expect(invalidResponse.body.code).toBe('PATIENT_REFERRAL_SOURCE_INVALID');
  });

  it('rejects registering a patient without patient.create permission (403)', async () => {
    const { app } = buildApp({ ...staffAuth, permissionKeys: ['patient.read'] });

    const response = await request(app).post('/api/v1/patients').send({
      fullName: 'John Doe',
      gender: 'MALE',
      dateOfBirth: '1998-08-10',
      phoneNumber: '08123456789',
      address: 'Jl. Contoh No. 10',
    });

    expect(response.status).toBe(403);
  });

  it('returns 404 with the standard error envelope for a non-existent patient id', async () => {
    const { app } = buildApp(staffAuth);

    const response = await request(app).get('/api/v1/patients/00000000-0000-4000-8000-000000000099');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
  });

});
