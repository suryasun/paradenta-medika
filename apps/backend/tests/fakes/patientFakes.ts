import { Patient } from '@prisma/client';
import { IPatientRepository, PatientListFilters, UpdatePatientProps } from '../../src/modules/patient/domain/repositories/IPatientRepository';
import { PatientProps } from '../../src/modules/patient/domain/entities/PatientEntity';
import { PagedResult } from '../../src/shared/http/pagination';
import { IEventBus } from '../../src/shared/events/EventBus';
import { nextFakeUuid } from './uuid';

function toPatientRow(medicalRecordNo: string, props: PatientProps): Patient {
  return {
    id: nextFakeUuid(),
    medicalRecordNo,
    patientName: props.patientName,
    identityType: props.identityType ?? null,
    identityNumber: props.identityNumber ?? null,
    birthPlace: props.birthPlace ?? null,
    birthDate: props.birthDate,
    gender: props.gender,
    phone: props.phone,
    email: props.email ?? null,
    address: props.address,
    registrationDate: new Date(),
    active: true,
    createdAt: new Date(),
    createdBy: null,
    updatedAt: new Date(),
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  } as Patient;
}

export class FakePatientRepository implements IPatientRepository {
  patients = new Map<string, Patient>();

  async findById(id: string): Promise<Patient | null> {
    return this.patients.get(id) ?? null;
  }

  async findByMRN(medicalRecordNo: string): Promise<Patient | null> {
    return [...this.patients.values()].find((p) => p.medicalRecordNo === medicalRecordNo) ?? null;
  }

  async findByIdentityNumber(identityType: string, identityNumber: string): Promise<Patient | null> {
    return (
      [...this.patients.values()].find((p) => p.identityType === identityType && p.identityNumber === identityNumber) ?? null
    );
  }

  async search(filters: PatientListFilters): Promise<PagedResult<Patient>> {
    let all = [...this.patients.values()];
    const activeFilter = filters.status ? filters.status === 'ACTIVE' : true;
    all = all.filter((p) => p.active === activeFilter);
    if (filters.gender) all = all.filter((p) => p.gender === filters.gender);
    if (filters.search) {
      const term = filters.search.toLowerCase();
      all = all.filter((p) => p.patientName.toLowerCase().includes(term) || p.medicalRecordNo.toLowerCase().includes(term));
    }
    const start = (filters.page - 1) * filters.limit;
    return { items: all.slice(start, start + filters.limit), total: all.length };
  }

  async create(medicalRecordNo: string, props: PatientProps): Promise<Patient> {
    const patient = toPatientRow(medicalRecordNo, props);
    this.patients.set(patient.id, patient);
    return patient;
  }

  async update(id: string, props: UpdatePatientProps): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) throw new Error('not found');
    if (props.patientName) patient.patientName = props.patientName;
    if (props.phone) patient.phone = props.phone;
    if (props.email !== undefined) patient.email = props.email ?? null;
    if (props.address) patient.address = props.address;
    patient.updatedAt = new Date();
    return patient;
  }

  async archive(id: string): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) throw new Error('not found');
    patient.active = false;
    return patient;
  }

  async restore(id: string): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) throw new Error('not found');
    patient.active = true;
    return patient;
  }

  async exists(id: string): Promise<boolean> {
    return this.patients.has(id);
  }

  async count(): Promise<number> {
    return this.patients.size;
  }
}

export class FakeEventBus implements IEventBus {
  published: Array<{ eventName: string; payload: unknown }> = [];

  async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    this.published.push({ eventName, payload });
  }

  subscribe(): void {
    /* no-op for tests */
  }
}
