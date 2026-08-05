import { PatientEmergencyContact } from '@prisma/client';

export interface CreatePatientEmergencyContactProps {
  patientId: string;
  contactName: string;
  relationship: string;
  phone: string;
  address?: string;
}

export type UpdatePatientEmergencyContactProps = Partial<Omit<CreatePatientEmergencyContactProps, 'patientId'>>;

// task-288 (Epic PE5): no isPrimary concept, unlike IPatientAddressRepository
// -- a patient may have any number of emergency contacts with no ordering
// requirement beyond createdAt (not literally in §12.5's column list, so
// ordering falls back to insertion order / id).
export interface IPatientEmergencyContactRepository {
  listForPatient(patientId: string): Promise<PatientEmergencyContact[]>;
  findById(id: string): Promise<PatientEmergencyContact | null>;
  create(props: CreatePatientEmergencyContactProps): Promise<PatientEmergencyContact>;
  update(id: string, props: UpdatePatientEmergencyContactProps): Promise<PatientEmergencyContact>;
  delete(id: string): Promise<void>;
}
