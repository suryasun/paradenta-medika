import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientEntity, PatientGenderValue } from '../../domain/entities/PatientEntity';
import { DuplicateIdentityException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_REGISTERED_EVENT, PatientRegisteredPayload } from '../../domain/events/PatientEvents';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';
import { MedicalRecordNumberGenerator } from '../services/MedicalRecordNumberGenerator';

export interface QuickAddPatientInput {
  fullName: string;
  address: string;
  phoneNumber: string;
  identityNumber: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

// task-289 (Epic PE6): the request contract has no gender/dateOfBirth
// fields, but the `patients` table columns are NOT NULL and this feature
// is not permitted to alter that schema. Per the user-approved resolution
// to this gap, quick-added patients get a clearly-flagged, easily
// detectable placeholder in both fields -- correctable afterward via
// UpdatePatientUseCase (task-029), which now accepts optional
// gender/dateOfBirth for exactly this purpose. Neither value carries any
// clinical meaning; they exist only to satisfy the frozen schema.
const QUICK_ADD_PLACEHOLDER_GENDER: PatientGenderValue = 'FEMALE';
const QUICK_ADD_PLACEHOLDER_BIRTH_DATE = new Date('1900-01-01T00:00:00.000Z');

// docs/03-sad/12-module-patient.md §21.1a has no identityType field at
// all -- only a bare `identityNumber`. KTP (Indonesian national ID) is
// the default/most common identity document type in this product's
// domain, so it is used here to satisfy findByIdentityNumber's existing
// (identityType, identityNumber) duplicate-check signature without
// inventing a new one.
const QUICK_ADD_IDENTITY_TYPE = 'KTP';

/**
 * docs/03-sad/12-module-patient.md §17.1: deliberately distinct from
 * CreatePatientUseCase, not a thin wrapper with defaulted optional
 * fields -- its own request contract, but it still writes to the same
 * `patients` table via the same repository/MRN-generator/duplicate-check
 * path so the resulting record is fully real and immediately usable
 * (e.g. as a Reservation's patientId).
 */
export class QuickAddPatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly mrnGenerator: MedicalRecordNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: QuickAddPatientInput): Promise<PatientResponseDto> {
    const existing = await this.patientRepository.findByIdentityNumber(QUICK_ADD_IDENTITY_TYPE, input.identityNumber);
    if (existing) {
      throw new DuplicateIdentityException();
    }

    const entity = PatientEntity.create({
      patientName: input.fullName,
      gender: QUICK_ADD_PLACEHOLDER_GENDER,
      birthDate: QUICK_ADD_PLACEHOLDER_BIRTH_DATE,
      identityType: QUICK_ADD_IDENTITY_TYPE,
      identityNumber: input.identityNumber,
      phone: input.phoneNumber,
      address: input.address,
    });

    const medicalRecordNo = await this.mrnGenerator.generate();
    const patient = await this.patientRepository.create(medicalRecordNo, entity.props);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Patient',
      patient.id,
      'CREATE',
      null,
      { medicalRecordNo, fullName: input.fullName, source: 'quick-add' },
      auditContext,
    );

    const eventPayload: PatientRegisteredPayload = {
      event: PATIENT_REGISTERED_EVENT,
      patientId: patient.id,
      medicalRecordNumber: patient.medicalRecordNo,
      fullName: patient.patientName,
      registeredAt: patient.createdAt.toISOString(),
    };
    await this.eventBus.publish(PATIENT_REGISTERED_EVENT, eventPayload);

    return toPatientResponse(patient);
  }
}
