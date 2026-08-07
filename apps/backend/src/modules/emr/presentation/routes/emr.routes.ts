import { RequestHandler, Router } from 'express';
import multer from 'multer';
import { ConfigService } from '../../../../shared/config/ConfigService';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateBody } from '../../../../shared/http/validateBody';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { LocalFilesystemStorageService } from '../../../../shared/storage/LocalFilesystemStorageService';
import { OpenVisitRequestDto } from '../../application/dtos/OpenVisitRequestDto';
import { RecordVitalSignRequestDto } from '../../application/dtos/RecordVitalSignRequestDto';
import { RecordSoapNoteRequestDto } from '../../application/dtos/RecordSoapNoteRequestDto';
import { RecordDiagnosisRequestDto } from '../../application/dtos/RecordDiagnosisRequestDto';
import { RecordTreatmentRequestDto } from '../../application/dtos/RecordTreatmentRequestDto';
import { UpdateTreatmentRequestDto } from '../../application/dtos/UpdateTreatmentRequestDto';
import { VisitNumberGenerator } from '../../application/services/VisitNumberGenerator';
import { OpenVisitUseCase } from '../../application/use-cases/OpenVisitUseCase';
import { GetVisitDetailUseCase } from '../../application/use-cases/GetVisitDetailUseCase';
import { RecordVitalSignUseCase } from '../../application/use-cases/RecordVitalSignUseCase';
import { RecordSoapNoteUseCase } from '../../application/use-cases/RecordSoapNoteUseCase';
import { RecordDiagnosisUseCase } from '../../application/use-cases/RecordDiagnosisUseCase';
import { RecordTreatmentUseCase } from '../../application/use-cases/RecordTreatmentUseCase';
import { UpdateTreatmentUseCase } from '../../application/use-cases/UpdateTreatmentUseCase';
import { RemoveTreatmentUseCase } from '../../application/use-cases/RemoveTreatmentUseCase';
import { CloseVisitUseCase } from '../../application/use-cases/CloseVisitUseCase';
import { RecordMedicalHistoryRequestDto } from '../../application/dtos/RecordMedicalHistoryRequestDto';
import { RecordAllergyRequestDto } from '../../application/dtos/RecordAllergyRequestDto';
import { RecordMedicalHistoryUseCase } from '../../application/use-cases/RecordMedicalHistoryUseCase';
import { GetMedicalHistoryUseCase } from '../../application/use-cases/GetMedicalHistoryUseCase';
import { RecordAllergyUseCase } from '../../application/use-cases/RecordAllergyUseCase';
import { GetAllergiesUseCase } from '../../application/use-cases/GetAllergiesUseCase';
import { RecordToothConditionRequestDto } from '../../application/dtos/RecordToothConditionRequestDto';
import { RecordToothConditionUseCase } from '../../application/use-cases/RecordToothConditionUseCase';
import { GetCurrentOdontogramUseCase } from '../../application/use-cases/GetCurrentOdontogramUseCase';
import { GetToothHistoryUseCase } from '../../application/use-cases/GetToothHistoryUseCase';
import { CreateTreatmentPlanRequestDto } from '../../application/dtos/CreateTreatmentPlanRequestDto';
import { ConvertTreatmentPlanToReservationRequestDto } from '../../application/dtos/ConvertTreatmentPlanToReservationRequestDto';
import { CreateTreatmentPlanUseCase } from '../../application/use-cases/CreateTreatmentPlanUseCase';
import { GetTreatmentPlanUseCase } from '../../application/use-cases/GetTreatmentPlanUseCase';
import { ConvertTreatmentPlanToReservationUseCase } from '../../application/use-cases/ConvertTreatmentPlanToReservationUseCase';
import { CreatePeriodontalAssessmentRequestDto } from '../../application/dtos/CreatePeriodontalAssessmentRequestDto';
import { SaveMeasurementRequestDto } from '../../application/dtos/SaveMeasurementRequestDto';
import { UpdateMeasurementRequestDto } from '../../application/dtos/UpdateMeasurementRequestDto';
import { CreatePeriodontalAssessmentUseCase } from '../../application/use-cases/CreatePeriodontalAssessmentUseCase';
import { AddPeriodontalMeasurementUseCase } from '../../application/use-cases/AddPeriodontalMeasurementUseCase';
import { UpdatePeriodontalMeasurementUseCase } from '../../application/use-cases/UpdatePeriodontalMeasurementUseCase';
import { DeletePeriodontalMeasurementUseCase } from '../../application/use-cases/DeletePeriodontalMeasurementUseCase';
import { GetPeriodontalAssessmentUseCase } from '../../application/use-cases/GetPeriodontalAssessmentUseCase';
import { GetPeriodontalAssessmentHistoryUseCase } from '../../application/use-cases/GetPeriodontalAssessmentHistoryUseCase';
import { LockPeriodontalAssessmentUseCase } from '../../application/use-cases/LockPeriodontalAssessmentUseCase';
import { CreateReferralRequestDto } from '../../application/dtos/CreateReferralRequestDto';
import { CreateFollowUpRequestDto } from '../../application/dtos/CreateFollowUpRequestDto';
import { CreateReferralUseCase } from '../../application/use-cases/CreateReferralUseCase';
import { GetReferralsUseCase } from '../../application/use-cases/GetReferralsUseCase';
import { CreateFollowUpUseCase } from '../../application/use-cases/CreateFollowUpUseCase';
import { GetFollowUpsUseCase } from '../../application/use-cases/GetFollowUpsUseCase';
import { UploadAttachmentRequestDto } from '../../application/dtos/UploadAttachmentRequestDto';
import { AnnotateAttachmentRequestDto } from '../../application/dtos/AnnotateAttachmentRequestDto';
import { UploadAttachmentUseCase } from '../../application/use-cases/UploadAttachmentUseCase';
import { GetAttachmentDetailUseCase } from '../../application/use-cases/GetAttachmentDetailUseCase';
import { DownloadAttachmentUseCase } from '../../application/use-cases/DownloadAttachmentUseCase';
import { AnnotateAttachmentUseCase } from '../../application/use-cases/AnnotateAttachmentUseCase';
import { ListVisitAttachmentsUseCase } from '../../application/use-cases/ListVisitAttachmentsUseCase';
import { ArchiveAttachmentUseCase } from '../../application/use-cases/ArchiveAttachmentUseCase';
import { RestoreAttachmentVersionUseCase } from '../../application/use-cases/RestoreAttachmentVersionUseCase';
import { GetAttachmentVersionsUseCase } from '../../application/use-cases/GetAttachmentVersionsUseCase';
import { CreatePrescriptionRequestDto } from '../../application/dtos/CreatePrescriptionRequestDto';
import { CreatePrescriptionUseCase } from '../../application/use-cases/CreatePrescriptionUseCase';
import { GetPrescriptionHistoryUseCase } from '../../application/use-cases/GetPrescriptionHistoryUseCase';
import { PrintPrescriptionUseCase } from '../../application/use-cases/PrintPrescriptionUseCase';
import { AllergyCheckService } from '../../application/services/AllergyCheckService';
import { CreateConsentTemplateRequestDto, UpdateConsentTemplateRequestDto } from '../../application/dtos/ConsentTemplateRequestDto';
import { CreateConsentRequestDto } from '../../application/dtos/CreateConsentRequestDto';
import { SignConsentRequestDto } from '../../application/dtos/SignConsentRequestDto';
import { CreateConsentUseCase } from '../../application/use-cases/CreateConsentUseCase';
import { SignConsentUseCase } from '../../application/use-cases/SignConsentUseCase';
import { GetConsentUseCase } from '../../application/use-cases/GetConsentUseCase';
import { ListPatientConsentsUseCase } from '../../application/use-cases/ListPatientConsentsUseCase';
import { IssueMedicalCertificateRequestDto } from '../../application/dtos/IssueMedicalCertificateRequestDto';
import { CertificateNumberGenerator } from '../../application/services/CertificateNumberGenerator';
import { IssueMedicalCertificateUseCase } from '../../application/use-cases/IssueMedicalCertificateUseCase';
import { GetMedicalCertificateUseCase } from '../../application/use-cases/GetMedicalCertificateUseCase';
import { ListPatientMedicalCertificatesUseCase } from '../../application/use-cases/ListPatientMedicalCertificatesUseCase';
import { GetTimelineEventsQueryDto } from '../../application/dtos/GetTimelineEventsQueryDto';
import { GetPatientTimelineUseCase } from '../../application/use-cases/GetPatientTimelineUseCase';
import { GetPatientTimelineSummaryUseCase } from '../../application/use-cases/GetPatientTimelineSummaryUseCase';
import { GetPatientTimelineEventsUseCase } from '../../application/use-cases/GetPatientTimelineEventsUseCase';
import { GetPatientTimelineAttachmentsUseCase } from '../../application/use-cases/GetPatientTimelineAttachmentsUseCase';
import { buildCrudUseCases } from '../../../master-data/application/shared/crudUseCaseFactory';
import { buildCrudController } from '../../../master-data/presentation/controllers/crudControllerFactory';
import { VisitRepository } from '../../infrastructure/repositories/VisitRepository';
import { VitalSignRepository } from '../../infrastructure/repositories/VitalSignRepository';
import { SoapNoteRepository } from '../../infrastructure/repositories/SoapNoteRepository';
import { VisitDiagnosisRepository } from '../../infrastructure/repositories/VisitDiagnosisRepository';
import { VisitTreatmentRepository } from '../../infrastructure/repositories/VisitTreatmentRepository';
import { ItemRepository } from '../../../warehouse/infrastructure/repositories/ItemRepository';
import { WarehouseLocationRepository } from '../../../warehouse/infrastructure/repositories/WarehouseLocationRepository';
import { InvoiceRepository } from '../../../billing/infrastructure/repositories/InvoiceRepository';
import { MedicalHistoryRepository } from '../../infrastructure/repositories/MedicalHistoryRepository';
import { AllergyRepository } from '../../infrastructure/repositories/AllergyRepository';
import { OdontogramRepository } from '../../infrastructure/repositories/OdontogramRepository';
import { TreatmentPlanRepository } from '../../infrastructure/repositories/TreatmentPlanRepository';
import { PeriodontalAssessmentRepository } from '../../infrastructure/repositories/PeriodontalAssessmentRepository';
import { PeriodontalMeasurementRepository } from '../../infrastructure/repositories/PeriodontalMeasurementRepository';
import { ReferralRepository } from '../../infrastructure/repositories/ReferralRepository';
import { FollowUpRepository } from '../../infrastructure/repositories/FollowUpRepository';
import { AttachmentRepository } from '../../infrastructure/repositories/AttachmentRepository';
import { AttachmentAnnotationRepository } from '../../infrastructure/repositories/AttachmentAnnotationRepository';
import { PrescriptionRepository } from '../../infrastructure/repositories/PrescriptionRepository';
import { ConsentTemplateRepository } from '../../infrastructure/repositories/ConsentTemplateRepository';
import { ConsentRepository } from '../../infrastructure/repositories/ConsentRepository';
import { MedicalCertificateRepository } from '../../infrastructure/repositories/MedicalCertificateRepository';
import { VisitController } from '../controllers/VisitController';
import { MedicalHistoryController } from '../controllers/MedicalHistoryController';
import { AllergyController } from '../controllers/AllergyController';
import { OdontogramController } from '../controllers/OdontogramController';
import { TreatmentPlanController } from '../controllers/TreatmentPlanController';
import { PeriodontalAssessmentController } from '../controllers/PeriodontalAssessmentController';
import { ReferralController } from '../controllers/ReferralController';
import { FollowUpController } from '../controllers/FollowUpController';
import { AttachmentController } from '../controllers/AttachmentController';
import { AttachmentFileController } from '../controllers/AttachmentFileController';
import { PrescriptionController } from '../controllers/PrescriptionController';
import { ConsentController } from '../controllers/ConsentController';
import { MedicalCertificateController } from '../controllers/MedicalCertificateController';
import { TimelineController } from '../controllers/TimelineController';
import { QueueRepository } from '../../../queue/infrastructure/repositories/QueueRepository';
import { TreatmentRepository } from '../../../master-data/infrastructure/repositories/TreatmentRepository';
import { ToothConditionRepository } from '../../../master-data/infrastructure/repositories/ToothConditionRepository';
import { DoctorRepository } from '../../../master-data/infrastructure/repositories/DoctorRepository';
import { PatientRepository } from '../../../patient/infrastructure/repositories/PatientRepository';
import { ReservationRepository } from '../../../reservation/infrastructure/repositories/ReservationRepository';
import { DoctorScheduleRepository } from '../../../reservation/infrastructure/repositories/DoctorScheduleRepository';
import { DoctorScheduleValidator } from '../../../reservation/application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../../reservation/application/services/ReservationNumberGenerator';
import { CreateReservationUseCase } from '../../../reservation/application/use-cases/CreateReservationUseCase';

/**
 * docs/06-tasks/task-048.md..task-053.md composition root. Base path
 * `/api/v1/emr/visits` follows the convention already used elsewhere in
 * docs/03-sad/15-module-emr.md (`/api/v1/emr/attachments`, `/api/v1/emr/
 * periodontal-assessments`, `/api/v1/emr/timeline/...`) -- task-048.md's
 * own citation of "Section 39" for the exact path does not correspond to
 * an OpenAPI section in this document (that section number belongs to a
 * different, Odontogram-scoped part of the concatenated doc), so the
 * established `/api/v1/emr/...` prefix was extrapolated instead of
 * inventing an unrelated one. Permission codes are the literal
 * `emr.*` codes named in each task's Security Impact section.
 */
export function buildEmrModule(
  config: ConfigService,
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
  const visitRepository = new VisitRepository();
  const vitalSignRepository = new VitalSignRepository();
  const soapNoteRepository = new SoapNoteRepository();
  const diagnosisRepository = new VisitDiagnosisRepository();
  const visitTreatmentRepository = new VisitTreatmentRepository();
  const itemRepository = new ItemRepository();
  // docs/06-tasks/task-317.md/task-318.md: shared, read-only Billing
  // repository instance -- reused by both RecordTreatmentUseCase (payment
  // lock check) and GetVisitDetailUseCase (isTreatmentLocked flag).
  const invoiceRepository = new InvoiceRepository();
  const warehouseLocationRepository = new WarehouseLocationRepository();
  const queueRepository = new QueueRepository();
  const treatmentRepository = new TreatmentRepository();
  const visitNumberGenerator = new VisitNumberGenerator(visitRepository);
  const medicalHistoryRepository = new MedicalHistoryRepository();
  const allergyRepository = new AllergyRepository();
  const odontogramRepository = new OdontogramRepository();
  const toothConditionRepository = new ToothConditionRepository();
  const treatmentPlanRepository = new TreatmentPlanRepository();
  const periodontalAssessmentRepository = new PeriodontalAssessmentRepository();
  const periodontalMeasurementRepository = new PeriodontalMeasurementRepository();
  const referralRepository = new ReferralRepository();
  const followUpRepository = new FollowUpRepository();
  const attachmentRepository = new AttachmentRepository();
  const attachmentAnnotationRepository = new AttachmentAnnotationRepository();
  const prescriptionRepository = new PrescriptionRepository();
  const allergyCheckService = new AllergyCheckService(allergyRepository);
  const consentTemplateRepository = new ConsentTemplateRepository();
  const consentRepository = new ConsentRepository();
  const medicalCertificateRepository = new MedicalCertificateRepository();
  const certificateNumberGenerator = new CertificateNumberGenerator(medicalCertificateRepository);
  const objectStorage = new LocalFilesystemStorageService(config.get('storageRoot'), config.get('jwtSecret'));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
  const patientRepository = new PatientRepository();
  const doctorRepository = new DoctorRepository();
  const reservationRepository = new ReservationRepository();
  const doctorScheduleRepository = new DoctorScheduleRepository();
  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, doctorScheduleRepository, reservationRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
  const createReservationUseCase = new CreateReservationUseCase(
    reservationRepository,
    patientRepository,
    doctorRepository,
    scheduleValidator,
    reservationNumberGenerator,
    auditService,
    eventBus,
  );

  const controller = new VisitController(
    new OpenVisitUseCase(visitRepository, queueRepository, visitNumberGenerator, auditService),
    new GetVisitDetailUseCase(visitRepository, vitalSignRepository, soapNoteRepository, diagnosisRepository, visitTreatmentRepository, invoiceRepository),
    new RecordVitalSignUseCase(visitRepository, vitalSignRepository, auditService),
    new RecordSoapNoteUseCase(visitRepository, soapNoteRepository, auditService),
    new RecordDiagnosisUseCase(visitRepository, diagnosisRepository, auditService),
    new RecordTreatmentUseCase(visitRepository, visitTreatmentRepository, treatmentRepository, itemRepository, invoiceRepository, auditService, eventBus),
    new UpdateTreatmentUseCase(visitRepository, visitTreatmentRepository, treatmentRepository, invoiceRepository, auditService, eventBus),
    new RemoveTreatmentUseCase(visitRepository, visitTreatmentRepository, invoiceRepository, auditService, eventBus),
    new CloseVisitUseCase(visitRepository, soapNoteRepository, visitTreatmentRepository, warehouseLocationRepository, auditService, eventBus),
  );

  const medicalHistoryController = new MedicalHistoryController(
    new RecordMedicalHistoryUseCase(patientRepository, medicalHistoryRepository, auditService),
    new GetMedicalHistoryUseCase(patientRepository, medicalHistoryRepository),
  );

  const allergyController = new AllergyController(
    new RecordAllergyUseCase(patientRepository, allergyRepository, auditService),
    new GetAllergiesUseCase(patientRepository, allergyRepository),
  );

  const odontogramController = new OdontogramController(
    new RecordToothConditionUseCase(visitRepository, odontogramRepository, toothConditionRepository, auditService),
    new GetCurrentOdontogramUseCase(patientRepository, odontogramRepository),
    new GetToothHistoryUseCase(patientRepository, odontogramRepository),
  );

  const treatmentPlanController = new TreatmentPlanController(
    new CreateTreatmentPlanUseCase(visitRepository, treatmentPlanRepository, treatmentRepository, auditService),
    new GetTreatmentPlanUseCase(visitRepository, treatmentPlanRepository),
    new ConvertTreatmentPlanToReservationUseCase(treatmentPlanRepository, createReservationUseCase, auditService),
  );

  const periodontalAssessmentController = new PeriodontalAssessmentController(
    new CreatePeriodontalAssessmentUseCase(visitRepository, periodontalAssessmentRepository, auditService),
    new AddPeriodontalMeasurementUseCase(periodontalAssessmentRepository, periodontalMeasurementRepository, auditService),
    new UpdatePeriodontalMeasurementUseCase(periodontalAssessmentRepository, periodontalMeasurementRepository, auditService),
    new DeletePeriodontalMeasurementUseCase(periodontalAssessmentRepository, periodontalMeasurementRepository, auditService),
    new GetPeriodontalAssessmentUseCase(periodontalAssessmentRepository, periodontalMeasurementRepository),
    new GetPeriodontalAssessmentHistoryUseCase(periodontalAssessmentRepository),
    new LockPeriodontalAssessmentUseCase(periodontalAssessmentRepository, auditService),
  );

  const referralController = new ReferralController(
    new CreateReferralUseCase(visitRepository, referralRepository, auditService),
    new GetReferralsUseCase(visitRepository, referralRepository),
  );

  const followUpController = new FollowUpController(
    new CreateFollowUpUseCase(visitRepository, followUpRepository, createReservationUseCase, auditService),
    new GetFollowUpsUseCase(visitRepository, followUpRepository),
  );

  const uploadAttachmentUseCase = new UploadAttachmentUseCase(
    visitRepository,
    attachmentRepository,
    objectStorage,
    config.get('s3Bucket'),
    auditService,
  );

  const attachmentController = new AttachmentController(
    uploadAttachmentUseCase,
    new GetAttachmentDetailUseCase(attachmentRepository, attachmentAnnotationRepository),
    new DownloadAttachmentUseCase(attachmentRepository, objectStorage, auditService),
    new AnnotateAttachmentUseCase(attachmentRepository, attachmentAnnotationRepository, auditService),
    new ListVisitAttachmentsUseCase(attachmentRepository),
    new ArchiveAttachmentUseCase(attachmentRepository, auditService),
    new RestoreAttachmentVersionUseCase(attachmentRepository, auditService),
    new GetAttachmentVersionsUseCase(attachmentRepository),
  );

  const prescriptionController = new PrescriptionController(
    new CreatePrescriptionUseCase(visitRepository, prescriptionRepository, allergyCheckService, auditService),
    new GetPrescriptionHistoryUseCase(prescriptionRepository),
    new PrintPrescriptionUseCase(prescriptionRepository, patientRepository, doctorRepository),
  );

  const consentTemplateUseCases = buildCrudUseCases('ConsentTemplate', consentTemplateRepository, auditService);
  const consentTemplateController = buildCrudController(consentTemplateUseCases, 'ConsentTemplate');

  const consentController = new ConsentController(
    new CreateConsentUseCase(visitRepository, consentTemplateRepository, consentRepository, auditService),
    new SignConsentUseCase(
      consentRepository,
      consentTemplateRepository,
      patientRepository,
      doctorRepository,
      uploadAttachmentUseCase,
      auditService,
    ),
    new GetConsentUseCase(consentRepository),
    new ListPatientConsentsUseCase(consentRepository),
  );

  const medicalCertificateController = new MedicalCertificateController(
    new IssueMedicalCertificateUseCase(
      visitRepository,
      doctorRepository,
      medicalCertificateRepository,
      certificateNumberGenerator,
      uploadAttachmentUseCase,
      auditService,
    ),
    new GetMedicalCertificateUseCase(medicalCertificateRepository),
    new ListPatientMedicalCertificatesUseCase(medicalCertificateRepository),
  );

  const getPatientTimelineUseCase = new GetPatientTimelineUseCase(
    patientRepository,
    visitRepository,
    soapNoteRepository,
    diagnosisRepository,
    visitTreatmentRepository,
    prescriptionRepository,
    odontogramRepository,
    attachmentRepository,
    consentRepository,
    referralRepository,
    followUpRepository,
  );
  const timelineController = new TimelineController(
    getPatientTimelineUseCase,
    new GetPatientTimelineSummaryUseCase(
      patientRepository,
      visitRepository,
      medicalHistoryRepository,
      allergyRepository,
      treatmentPlanRepository,
      prescriptionRepository,
    ),
    new GetPatientTimelineEventsUseCase(getPatientTimelineUseCase),
    new GetPatientTimelineAttachmentsUseCase(patientRepository, attachmentRepository),
  );

  const router = Router();
  router.use(authenticate);

  router.post('/emr/visits', requirePermission('emr.visit.create'), validateBody(OpenVisitRequestDto), controller.open);
  router.get('/emr/visits/:id', requirePermission('emr.visit.read'), controller.detail);
  router.post(
    '/emr/visits/:id/vital-signs',
    requirePermission('emr.vital.record'),
    validateBody(RecordVitalSignRequestDto),
    controller.recordVitalSign,
  );
  router.put(
    '/emr/visits/:id/soap-note',
    requirePermission('emr.soap.record'),
    validateBody(RecordSoapNoteRequestDto),
    controller.recordSoapNote,
  );
  router.post(
    '/emr/visits/:id/diagnoses',
    requirePermission('emr.diagnosis.record'),
    validateBody(RecordDiagnosisRequestDto),
    controller.recordDiagnosis,
  );
  router.post(
    '/emr/visits/:id/treatments',
    requirePermission('emr.treatment.record'),
    validateBody(RecordTreatmentRequestDto),
    controller.recordTreatment,
  );
  // docs/06-tasks/task-321.md: Edit/Remove an existing Treatment entry, before its Invoice is PAID.
  router.patch(
    '/emr/visits/:id/treatments/:treatmentEntryId',
    requirePermission('emr.treatment.update'),
    validateBody(UpdateTreatmentRequestDto),
    controller.updateTreatment,
  );
  router.delete(
    '/emr/visits/:id/treatments/:treatmentEntryId',
    requirePermission('emr.treatment.delete'),
    controller.removeTreatment,
  );
  router.post('/emr/visits/:id/close', requirePermission('emr.visit.close'), controller.close);

  // docs/06-tasks/task-061.md/task-062.md: Patient-scoped (not Visit-scoped),
  // so routed under /patients/{patientId}/... rather than /emr/visits/{id}/...
  // per each task's own convention suggestion. GET reuses the existing
  // `emr.visit.read` permission rather than inventing a new read-specific
  // code, since neither task names one.
  router.post(
    '/patients/:patientId/medical-history',
    requirePermission('emr.medical-history.record'),
    validateBody(RecordMedicalHistoryRequestDto),
    medicalHistoryController.record,
  );
  router.get('/patients/:patientId/medical-history', requirePermission('emr.visit.read'), medicalHistoryController.list);

  router.post(
    '/patients/:patientId/allergies',
    requirePermission('emr.allergy.record'),
    validateBody(RecordAllergyRequestDto),
    allergyController.record,
  );
  router.get('/patients/:patientId/allergies', requirePermission('emr.visit.read'), allergyController.list);

  // docs/06-tasks/task-068.md: recorded under the Visit (the write path
  // needs an open Visit to attribute the entry to); task-069/070 are
  // Patient-scoped read views over the same append-only log.
  router.post(
    '/emr/visits/:id/odontogram',
    requirePermission('emr.odontogram.record'),
    validateBody(RecordToothConditionRequestDto),
    odontogramController.record,
  );
  router.get('/patients/:patientId/odontogram', requirePermission('emr.odontogram.read'), odontogramController.current);
  router.get(
    '/patients/:patientId/odontogram/:toothNumber/history',
    requirePermission('emr.odontogram.read'),
    odontogramController.history,
  );

  // docs/06-tasks/task-063.md/task-064.md.
  router.post(
    '/emr/visits/:id/treatment-plan',
    requirePermission('emr.treatment-plan.create'),
    validateBody(CreateTreatmentPlanRequestDto),
    treatmentPlanController.create,
  );
  router.get('/emr/visits/:id/treatment-plan', requirePermission('emr.treatment-plan.read'), treatmentPlanController.list);
  // task-064's Security Impact literally names both permissions -- chained
  // middleware enforces both rather than picking just one.
  router.post(
    '/emr/treatment-plan/:itemId/convert-to-reservation',
    requirePermission('emr.treatment-plan.read'),
    requirePermission('reservation.create'),
    validateBody(ConvertTreatmentPlanToReservationRequestDto),
    treatmentPlanController.convertToReservation,
  );

  // docs/06-tasks/task-071.md..task-077.md: literal endpoint paths per
  // docs/03-sad/15-module-emr.md Part 3.2D Section 39 OpenAPI Specification
  // (grep-verified, not convention-derived).
  router.post(
    '/emr/periodontal-assessments',
    requirePermission('emr.periodontal.create'),
    validateBody(CreatePeriodontalAssessmentRequestDto),
    periodontalAssessmentController.create,
  );
  router.post(
    '/emr/periodontal-assessments/:assessmentId/measurements',
    requirePermission('emr.periodontal.measurement.record'),
    validateBody(SaveMeasurementRequestDto),
    periodontalAssessmentController.addMeasurement,
  );
  router.put(
    '/emr/periodontal-assessments/:assessmentId/measurements/:id',
    requirePermission('emr.periodontal.measurement.update'),
    validateBody(UpdateMeasurementRequestDto),
    periodontalAssessmentController.updateMeasurement,
  );
  router.delete(
    '/emr/periodontal-assessments/:assessmentId/measurements/:id',
    requirePermission('emr.periodontal.measurement.delete'),
    periodontalAssessmentController.deleteMeasurement,
  );
  router.get(
    '/emr/periodontal-assessments/:assessmentId',
    requirePermission('emr.periodontal.read'),
    periodontalAssessmentController.detail,
  );
  router.get(
    '/emr/periodontal-assessments/:assessmentId/history',
    requirePermission('emr.periodontal.read'),
    periodontalAssessmentController.history,
  );
  router.post(
    '/emr/periodontal-assessments/:assessmentId/lock',
    requirePermission('emr.periodontal.lock'),
    periodontalAssessmentController.lock,
  );

  // docs/06-tasks/task-089.md/task-090.md.
  router.post(
    '/emr/visits/:id/referrals',
    requirePermission('emr.referral.create'),
    validateBody(CreateReferralRequestDto),
    referralController.create,
  );
  router.get('/emr/visits/:id/referrals', requirePermission('emr.visit.read'), referralController.list);
  router.post(
    '/emr/visits/:id/follow-ups',
    requirePermission('emr.followup.create'),
    validateBody(CreateFollowUpRequestDto),
    followUpController.create,
  );
  router.get('/emr/visits/:id/follow-ups', requirePermission('emr.visit.read'), followUpController.list);

  // docs/06-tasks/task-078.md..task-084.md: literal endpoint paths per
  // docs/03-sad/15-module-emr.md Section 60 OpenAPI Specification
  // (grep-verified, not convention-derived, except for the `attachmentId`
  // re-upload field documented on UploadAttachmentRequestDto).
  router.post(
    '/emr/attachments',
    requirePermission('emr.attachment.upload'),
    upload.single('file'),
    validateBody(UploadAttachmentRequestDto),
    attachmentController.upload,
  );
  router.get('/emr/attachments/:id', requirePermission('emr.attachment.read'), attachmentController.detail);
  router.get('/emr/attachments/:id/download', requirePermission('emr.attachment.read'), attachmentController.download);
  router.post(
    '/emr/attachments/:id/annotations',
    requirePermission('emr.attachment.annotate'),
    validateBody(AnnotateAttachmentRequestDto),
    attachmentController.annotate,
  );
  router.get('/emr/visits/:visitId/attachments', requirePermission('emr.attachment.read'), attachmentController.listByVisit);
  router.post('/emr/attachments/:id/archive', requirePermission('emr.attachment.archive'), attachmentController.archive);
  router.get('/emr/attachments/:id/versions', requirePermission('emr.attachment.read'), attachmentController.versions);
  router.post(
    '/emr/attachments/:id/versions/:version/restore',
    requirePermission('emr.attachment.restore'),
    attachmentController.restoreVersion,
  );

  // docs/06-tasks/task-065.md/task-066.md.
  router.post(
    '/emr/visits/:id/prescriptions',
    requirePermission('emr.prescription.create'),
    validateBody(CreatePrescriptionRequestDto),
    prescriptionController.create,
  );
  router.get('/patients/:patientId/prescriptions', requirePermission('emr.prescription.read'), prescriptionController.history);
  router.get('/emr/prescriptions/:id/print', requirePermission('emr.prescription.read'), prescriptionController.print);

  // docs/06-tasks/task-085.md.
  router.get(
    '/consent-templates',
    requirePermission('emr.consent-template.read'),
    validateQuery(ListQueryDto),
    consentTemplateController.list,
  );
  router.post(
    '/consent-templates',
    requirePermission('emr.consent-template.manage'),
    validateBody(CreateConsentTemplateRequestDto),
    consentTemplateController.create,
  );
  router.get('/consent-templates/:id', requirePermission('emr.consent-template.read'), consentTemplateController.detail);
  router.put(
    '/consent-templates/:id',
    requirePermission('emr.consent-template.manage'),
    validateBody(UpdateConsentTemplateRequestDto),
    consentTemplateController.update,
  );

  // docs/06-tasks/task-086.md/task-087.md.
  router.post('/emr/consents', requirePermission('emr.consent.create'), validateBody(CreateConsentRequestDto), consentController.create);
  router.post(
    '/emr/consents/:id/sign',
    requirePermission('emr.consent.sign'),
    validateBody(SignConsentRequestDto),
    consentController.sign,
  );
  router.get('/emr/consents/:id', requirePermission('emr.consent.read'), consentController.detail);
  router.get('/patients/:patientId/consents', requirePermission('emr.consent.read'), consentController.listByPatient);

  // docs/06-tasks/task-088.md.
  router.post(
    '/emr/visits/:id/medical-certificates',
    requirePermission('emr.certificate.issue'),
    validateBody(IssueMedicalCertificateRequestDto),
    medicalCertificateController.issue,
  );
  router.get('/emr/medical-certificates/:id', requirePermission('emr.certificate.read'), medicalCertificateController.detail);
  router.get(
    '/patients/:patientId/medical-certificates',
    requirePermission('emr.certificate.read'),
    medicalCertificateController.listByPatient,
  );

  // docs/06-tasks/task-091.md..task-094.md.
  router.get('/emr/timeline/:patientId', requirePermission('emr.timeline.read'), timelineController.timeline);
  router.get('/emr/timeline/:patientId/summary', requirePermission('emr.timeline.read'), timelineController.summary);
  router.get(
    '/emr/timeline/:patientId/events',
    requirePermission('emr.timeline.read'),
    validateQuery(GetTimelineEventsQueryDto),
    timelineController.events,
  );
  router.get(
    '/emr/timeline/:patientId/attachments',
    requirePermission('emr.timeline.read'),
    requirePermission('emr.attachment.read'),
    timelineController.attachments,
  );

  return router;
}

/**
 * docs/06-tasks/task-080.md: the signed-URL file-serving route is
 * deliberately a separate, unauthenticated router (see
 * AttachmentFileController) -- it cannot sit behind this module's
 * `router.use(authenticate)` above.
 */
export function buildAttachmentFileRouter(config: ConfigService): Router {
  const objectStorage = new LocalFilesystemStorageService(config.get('storageRoot'), config.get('jwtSecret'));
  const controller = new AttachmentFileController(objectStorage);

  const router = Router();
  router.get('/attachments/file/:token', controller.serve);
  return router;
}
