import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { CreatePatientRequestDto } from '../../src/modules/patient/application/dtos/CreatePatientRequestDto';
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

function buildApp(auth: AuthenticatedContext | undefined) {
  const patientRepository = new FakePatientRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
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
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get('/patients', requirePermission('patient.read', auditService), validateQuery(ListPatientQueryDto), controller.list);
  router.post('/patients', requirePermission('patient.create', auditService), validateBody(CreatePatientRequestDto), controller.create);
  router.get('/patients/:id', requirePermission('patient.read', auditService), controller.detail);

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app };
}

const staffAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['patient.read', 'patient.create'],
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
