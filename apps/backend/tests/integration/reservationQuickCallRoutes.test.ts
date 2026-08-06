import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { QuickNewPatientCallRequestDto } from '../../src/modules/reservation/application/dtos/QuickNewPatientCallRequestDto';
import { QuickNewPatientCallUseCase } from '../../src/modules/reservation/application/use-cases/QuickNewPatientCallUseCase';
import { DoctorScheduleValidator } from '../../src/modules/reservation/application/services/DoctorScheduleValidator';
import { MedicalRecordNumberGenerator } from '../../src/modules/patient/application/services/MedicalRecordNumberGenerator';
import { ReservationNumberGenerator } from '../../src/modules/reservation/application/services/ReservationNumberGenerator';
import { ReservationController } from '../../src/modules/reservation/presentation/controllers/ReservationController';
import { CreateReservationUseCase } from '../../src/modules/reservation/application/use-cases/CreateReservationUseCase';
import { WalkInRegistrationUseCase } from '../../src/modules/reservation/application/use-cases/WalkInRegistrationUseCase';
import { ListReservationsUseCase } from '../../src/modules/reservation/application/use-cases/ListReservationsUseCase';
import { GetReservationUseCase } from '../../src/modules/reservation/application/use-cases/GetReservationUseCase';
import { UpdateReservationUseCase } from '../../src/modules/reservation/application/use-cases/UpdateReservationUseCase';
import { RescheduleReservationUseCase } from '../../src/modules/reservation/application/use-cases/RescheduleReservationUseCase';
import { CancelReservationUseCase } from '../../src/modules/reservation/application/use-cases/CancelReservationUseCase';
import { CheckInPatientUseCase } from '../../src/modules/reservation/application/use-cases/CheckInPatientUseCase';
import { ReservationAnalyticsUseCase } from '../../src/modules/reservation/application/use-cases/ReservationAnalyticsUseCase';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../fakes/patientFakes';
import { FakeDoctorRepository } from '../fakes/masterDataFakes';
import {
  FakeDoctorScheduleRepository,
  FakeQuickNewPatientCallRepository,
  FakeReservationRepository,
  FakeReservationTimelineRepository,
  buildDoctorSchedule,
} from '../fakes/reservationFakes';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

function buildApp(auth: AuthenticatedContext | undefined) {
  const patientRepository = new FakePatientRepository();
  const reservationRepository = new FakeReservationRepository();
  const doctorRepository = new FakeDoctorRepository();
  const scheduleRepository = new FakeDoctorScheduleRepository();
  const timelineRepository = new FakeReservationTimelineRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();

  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
  const quickNewPatientCallRepository = new FakeQuickNewPatientCallRepository(patientRepository, reservationRepository);

  const controller = new ReservationController(
    new CreateReservationUseCase(reservationRepository, patientRepository, doctorRepository, scheduleValidator, reservationNumberGenerator, auditService, eventBus),
    new WalkInRegistrationUseCase(reservationRepository, patientRepository, doctorRepository, reservationNumberGenerator, auditService, eventBus),
    new ListReservationsUseCase(reservationRepository),
    new GetReservationUseCase(reservationRepository),
    new UpdateReservationUseCase(reservationRepository, doctorRepository, scheduleValidator, auditService, eventBus),
    new RescheduleReservationUseCase(reservationRepository, timelineRepository, scheduleValidator, auditService, eventBus),
    new CancelReservationUseCase(reservationRepository, timelineRepository, auditService, eventBus),
    new CheckInPatientUseCase(reservationRepository, timelineRepository, auditService, eventBus),
    new ReservationAnalyticsUseCase(reservationRepository),
    new QuickNewPatientCallUseCase(
      patientRepository,
      doctorRepository,
      scheduleValidator,
      new MedicalRecordNumberGenerator(patientRepository),
      reservationNumberGenerator,
      quickNewPatientCallRepository,
      auditService,
      eventBus,
    ),
  );

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.post(
    '/reservations/quick-call',
    requirePermission('patient.create', auditService),
    requirePermission('reservation.create', auditService),
    validateBody(QuickNewPatientCallRequestDto),
    controller.quickCall,
  );
  router.get('/reservations/:id', requirePermission('reservation.read', auditService), controller.detail);
  router.get('/patients/:id', requirePermission('patient.read', auditService), async (req, res, next) => {
    try {
      const patient = await patientRepository.findById(req.params.id);
      res.json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  });

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, doctorRepository, scheduleRepository };
}

const staffAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['patient.read', 'patient.create', 'reservation.read', 'reservation.create'],
};

// docs/06-tasks/task-292.md Testing Required: "POST /reservations/quick-call
// returns a full ReservationResponseDto with a real MRN-backed patientId,
// and that patient/reservation pair is immediately visible via GET
// /patients/{id} and GET /reservations/{id}."
describe('POST /reservations/quick-call', () => {
  it('creates a patient and reservation together, both immediately visible via their own GET endpoints', async () => {
    const { app, doctorRepository, scheduleRepository } = buildApp(staffAuth);
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const response = await request(app)
      .post('/api/v1/reservations/quick-call')
      .send({
        fullName: 'Phone Caller',
        address: 'Jl. Contoh No. 7',
        phoneNumber: '081200000010',
        identityNumber: '3171000000009010',
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('BOOKED');
    expect(response.body.data.patientType).toBe('NEW');
    const patientId = response.body.data.patientId as string;

    const reservationDetail = await request(app).get(`/api/v1/reservations/${response.body.data.id}`);
    expect(reservationDetail.status).toBe(200);
    expect(reservationDetail.body.data.patientId).toBe(patientId);

    const patientDetail = await request(app).get(`/api/v1/patients/${patientId}`);
    expect(patientDetail.status).toBe(200);
    expect(patientDetail.body.data.medicalRecordNo).toBe('MRN000001');
  });

  it('rejects a request missing patient.create permission even when reservation.create is present', async () => {
    const { app, doctorRepository, scheduleRepository } = buildApp({
      ...staffAuth,
      permissionKeys: ['reservation.create', 'reservation.read'],
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const response = await request(app)
      .post('/api/v1/reservations/quick-call')
      .send({
        fullName: 'Phone Caller',
        address: 'Jl. Contoh No. 8',
        phoneNumber: '081200000011',
        identityNumber: '3171000000009011',
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
      });

    expect(response.status).toBe(403);
  });
});
