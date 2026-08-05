import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import {
  CreatePatientEmergencyContactRequestDto,
  UpdatePatientEmergencyContactRequestDto,
} from '../../src/modules/patient/application/dtos/PatientEmergencyContactRequestDto';
import { AddEmergencyContactUseCase } from '../../src/modules/patient/application/use-cases/AddEmergencyContactUseCase';
import { ListEmergencyContactsUseCase } from '../../src/modules/patient/application/use-cases/ListEmergencyContactsUseCase';
import { UpdateEmergencyContactUseCase } from '../../src/modules/patient/application/use-cases/UpdateEmergencyContactUseCase';
import { DeleteEmergencyContactUseCase } from '../../src/modules/patient/application/use-cases/DeleteEmergencyContactUseCase';
import { PatientEmergencyContactController } from '../../src/modules/patient/presentation/controllers/PatientEmergencyContactController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakePatientEmergencyContactRepository, FakePatientRepository } from '../fakes/patientFakes';

// task-288 (Epic PE5, Patient Module Enhancement addendum): full CRUD
// cycle scoped to one patient, confirming a contact cannot be read/
// modified via another patient's id, per the task's own Testing Required.
function buildApp(auth: AuthenticatedContext | undefined) {
  const patientRepository = new FakePatientRepository();
  const contactRepository = new FakePatientEmergencyContactRepository();
  const auditService = new FakeAuditService();

  const controller = new PatientEmergencyContactController(
    new AddEmergencyContactUseCase(patientRepository, contactRepository, auditService),
    new ListEmergencyContactsUseCase(patientRepository, contactRepository),
    new UpdateEmergencyContactUseCase(contactRepository, auditService),
    new DeleteEmergencyContactUseCase(contactRepository, auditService),
  );

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.post(
    '/patients/:id/emergency-contacts',
    requirePermission('patient.update', auditService),
    validateBody(CreatePatientEmergencyContactRequestDto),
    controller.create,
  );
  router.get('/patients/:id/emergency-contacts', requirePermission('patient.read', auditService), controller.list);
  router.patch(
    '/patients/:id/emergency-contacts/:contactId',
    requirePermission('patient.update', auditService),
    validateBody(UpdatePatientEmergencyContactRequestDto),
    controller.update,
  );
  router.delete(
    '/patients/:id/emergency-contacts/:contactId',
    requirePermission('patient.update', auditService),
    controller.delete,
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

async function seedPatient(patientRepository: FakePatientRepository, mrn: string) {
  return patientRepository.create(mrn, {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('Patient Emergency Contact routes', () => {
  it('runs a full add -> list -> update -> delete cycle', async () => {
    const { app, patientRepository } = buildApp(staffAuth);
    const patient = await seedPatient(patientRepository, 'MRN000001');

    const createResponse = await request(app).post(`/api/v1/patients/${patient.id}/emergency-contacts`).send({
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phone: '0899988877',
      address: 'Jl. Kontak No. 5',
    });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.contactName).toBe('Jane Doe');
    const contactId = createResponse.body.data.id;

    const listResponse = await request(app).get(`/api/v1/patients/${patient.id}/emergency-contacts`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const updateResponse = await request(app)
      .patch(`/api/v1/patients/${patient.id}/emergency-contacts/${contactId}`)
      .send({ phone: '0899988866' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.phone).toBe('0899988866');

    const deleteResponse = await request(app).delete(`/api/v1/patients/${patient.id}/emergency-contacts/${contactId}`);
    expect(deleteResponse.status).toBe(200);

    const finalList = await request(app).get(`/api/v1/patients/${patient.id}/emergency-contacts`);
    expect(finalList.body.data).toHaveLength(0);
  });

  it('a contact cannot be read/modified via another patient id', async () => {
    const { app, patientRepository } = buildApp(staffAuth);
    const patientA = await seedPatient(patientRepository, 'MRN000001');
    const patientB = await seedPatient(patientRepository, 'MRN000002');

    const createResponse = await request(app).post(`/api/v1/patients/${patientA.id}/emergency-contacts`).send({
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phone: '0899988877',
    });
    const contactId = createResponse.body.data.id;

    const updateViaWrongPatient = await request(app)
      .patch(`/api/v1/patients/${patientB.id}/emergency-contacts/${contactId}`)
      .send({ phone: '000' });
    expect(updateViaWrongPatient.status).toBe(404);

    const deleteViaWrongPatient = await request(app).delete(`/api/v1/patients/${patientB.id}/emergency-contacts/${contactId}`);
    expect(deleteViaWrongPatient.status).toBe(404);

    const listForPatientB = await request(app).get(`/api/v1/patients/${patientB.id}/emergency-contacts`);
    expect(listForPatientB.body.data).toHaveLength(0);
  });

  it('requires contactName, relationship, and phone; address is optional', async () => {
    const { app, patientRepository } = buildApp(staffAuth);
    const patient = await seedPatient(patientRepository, 'MRN000001');

    const missingFields = await request(app).post(`/api/v1/patients/${patient.id}/emergency-contacts`).send({});
    expect(missingFields.status).toBe(400);

    const withoutAddress = await request(app)
      .post(`/api/v1/patients/${patient.id}/emergency-contacts`)
      .send({ contactName: 'Jane Doe', relationship: 'Spouse', phone: '0899988877' });
    expect(withoutAddress.status).toBe(201);
    expect(withoutAddress.body.data.address).toBeNull();
  });

  it('returns 404 for a non-existent patient', async () => {
    const { app } = buildApp(staffAuth);

    const response = await request(app).get('/api/v1/patients/00000000-0000-4000-8000-000000000099/emergency-contacts');

    expect(response.status).toBe(404);
  });

  it('rejects adding an emergency contact without patient.update permission (403)', async () => {
    const { app, patientRepository } = buildApp({ ...staffAuth, permissionKeys: ['patient.read'] });
    const patient = await seedPatient(patientRepository, 'MRN000001');

    const response = await request(app)
      .post(`/api/v1/patients/${patient.id}/emergency-contacts`)
      .send({ contactName: 'Jane Doe', relationship: 'Spouse', phone: '0899988877' });

    expect(response.status).toBe(403);
  });
});
