import { IEventBus } from '../../../../shared/events/EventBus';
import { ValidationException } from '../../../../shared/http/exceptions';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientEntity, PatientGenderValue, PatientIdentityTypeValue } from '../../domain/entities/PatientEntity';
import { DuplicateIdentityException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_REGISTERED_EVENT, PatientRegisteredPayload } from '../../domain/events/PatientEvents';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';
import { MedicalRecordNumberGenerator } from '../services/MedicalRecordNumberGenerator';

export interface CreatePatientInput {
  fullName: string;
  gender: PatientGenderValue;
  dateOfBirth: string;
  placeOfBirth?: string;
  phoneNumber: string;
  email?: string;
  identityType?: PatientIdentityTypeValue;
  identityNumber?: string;
  address: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/03-sad/03-clean-architecture.md Section 41.3 (Golden Reference flow):
 * Validate Request -> Check Duplicate Identity -> Generate MRN -> Create
 * Entity -> Save Repository -> Publish PatientRegistered Event -> Return
 * PatientResponse.
 */
export class CreatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly mrnGenerator: MedicalRecordNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreatePatientInput): Promise<PatientResponseDto> {
    if ((input.identityType && !input.identityNumber) || (!input.identityType && input.identityNumber)) {
      throw new ValidationException([
        { field: 'identityNumber', message: 'identityType and identityNumber must be provided together' },
      ]);
    }

    if (input.identityType && input.identityNumber) {
      const existing = await this.patientRepository.findByIdentityNumber(input.identityType, input.identityNumber);
      if (existing) {
        throw new DuplicateIdentityException();
      }
    }

    const entity = PatientEntity.create({
      patientName: input.fullName,
      gender: input.gender,
      birthDate: new Date(input.dateOfBirth),
      birthPlace: input.placeOfBirth,
      identityType: input.identityType,
      identityNumber: input.identityNumber,
      phone: input.phoneNumber,
      email: input.email,
      address: input.address,
    });

    const medicalRecordNo = await this.mrnGenerator.generate();
    const patient = await this.patientRepository.create(medicalRecordNo, entity.props);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Patient', patient.id, 'CREATE', null, { medicalRecordNo, fullName: input.fullName }, auditContext);

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
