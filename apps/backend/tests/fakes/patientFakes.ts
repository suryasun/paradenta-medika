import { Patient, PatientAddress, PatientEmergencyContact } from '@prisma/client';
import { IPatientRepository, PatientListFilters, UpdatePatientProps } from '../../src/modules/patient/domain/repositories/IPatientRepository';
import {
  CreatePatientAddressProps,
  IPatientAddressRepository,
  UpdatePatientAddressProps,
} from '../../src/modules/patient/domain/repositories/IPatientAddressRepository';
import {
  CreatePatientEmergencyContactProps,
  IPatientEmergencyContactRepository,
  UpdatePatientEmergencyContactProps,
} from '../../src/modules/patient/domain/repositories/IPatientEmergencyContactRepository';
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
    insuranceNumber: props.insuranceNumber ?? null,
    instagramHandle: props.instagramHandle ?? null,
    facebookHandle: props.facebookHandle ?? null,
    tiktokHandle: props.tiktokHandle ?? null,
    whatsappNumber: props.whatsappNumber ?? null,
    referralSourceId: props.referralSourceId ?? null,
    referredByUserId: props.referredByUserId ?? null,
    patientType: 'NEW',
    firstReservationAt: null,
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
    if (filters.patientType) all = all.filter((p) => p.patientType === filters.patientType);
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
    if (props.insuranceNumber !== undefined) patient.insuranceNumber = props.insuranceNumber ?? null;
    if (props.instagramHandle !== undefined) patient.instagramHandle = props.instagramHandle ?? null;
    if (props.facebookHandle !== undefined) patient.facebookHandle = props.facebookHandle ?? null;
    if (props.tiktokHandle !== undefined) patient.tiktokHandle = props.tiktokHandle ?? null;
    if (props.whatsappNumber !== undefined) patient.whatsappNumber = props.whatsappNumber ?? null;
    if (props.referralSourceId !== undefined) patient.referralSourceId = props.referralSourceId ?? null;
    if (props.referredByUserId !== undefined) patient.referredByUserId = props.referredByUserId ?? null;
    if (props.gender) patient.gender = props.gender;
    if (props.birthDate) patient.birthDate = props.birthDate;
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

  async markAsReturning(patientId: string, firstReservationAt: Date): Promise<void> {
    const patient = this.patients.get(patientId);
    if (!patient || patient.patientType !== 'NEW') return;
    patient.patientType = 'OLD';
    patient.firstReservationAt = firstReservationAt;
  }
}

// task-286 (Epic PE3, Patient Module Enhancement addendum)
export class FakePatientAddressRepository implements IPatientAddressRepository {
  addresses = new Map<string, PatientAddress>();

  async listForPatient(patientId: string): Promise<PatientAddress[]> {
    return [...this.addresses.values()].filter((a) => a.patientId === patientId);
  }

  async findById(id: string): Promise<PatientAddress | null> {
    return this.addresses.get(id) ?? null;
  }

  async countForPatient(patientId: string): Promise<number> {
    return [...this.addresses.values()].filter((a) => a.patientId === patientId).length;
  }

  async create(props: CreatePatientAddressProps): Promise<PatientAddress> {
    const address: PatientAddress = {
      id: nextFakeUuid(),
      patientId: props.patientId,
      provinceId: props.provinceId,
      regencyId: props.regencyId,
      districtId: props.districtId,
      villageId: props.villageId,
      addressLine: props.addressLine,
      postalCode: props.postalCode ?? null,
      isPrimary: props.isPrimary,
    };
    this.addresses.set(address.id, address);
    return address;
  }

  async update(id: string, props: UpdatePatientAddressProps): Promise<PatientAddress> {
    const address = this.addresses.get(id);
    if (!address) throw new Error('not found');
    if (props.provinceId !== undefined) address.provinceId = props.provinceId;
    if (props.regencyId !== undefined) address.regencyId = props.regencyId;
    if (props.districtId !== undefined) address.districtId = props.districtId;
    if (props.villageId !== undefined) address.villageId = props.villageId;
    if (props.addressLine !== undefined) address.addressLine = props.addressLine;
    if (props.postalCode !== undefined) address.postalCode = props.postalCode ?? null;
    if (props.isPrimary !== undefined) address.isPrimary = props.isPrimary;
    return address;
  }

  async delete(id: string): Promise<void> {
    this.addresses.delete(id);
  }

  async setPrimary(patientId: string, addressId: string): Promise<PatientAddress> {
    for (const address of this.addresses.values()) {
      if (address.patientId === patientId && address.id !== addressId) {
        address.isPrimary = false;
      }
    }
    const target = this.addresses.get(addressId);
    if (!target) throw new Error('not found');
    target.isPrimary = true;
    return target;
  }
}

// task-288 (Epic PE5, Patient Module Enhancement addendum)
export class FakePatientEmergencyContactRepository implements IPatientEmergencyContactRepository {
  contacts = new Map<string, PatientEmergencyContact>();

  async listForPatient(patientId: string): Promise<PatientEmergencyContact[]> {
    return [...this.contacts.values()].filter((c) => c.patientId === patientId);
  }

  async findById(id: string): Promise<PatientEmergencyContact | null> {
    return this.contacts.get(id) ?? null;
  }

  async create(props: CreatePatientEmergencyContactProps): Promise<PatientEmergencyContact> {
    const contact: PatientEmergencyContact = {
      id: nextFakeUuid(),
      patientId: props.patientId,
      contactName: props.contactName,
      relationship: props.relationship,
      phone: props.phone,
      address: props.address ?? null,
    };
    this.contacts.set(contact.id, contact);
    return contact;
  }

  async update(id: string, props: UpdatePatientEmergencyContactProps): Promise<PatientEmergencyContact> {
    const contact = this.contacts.get(id);
    if (!contact) throw new Error('not found');
    if (props.contactName !== undefined) contact.contactName = props.contactName;
    if (props.relationship !== undefined) contact.relationship = props.relationship;
    if (props.phone !== undefined) contact.phone = props.phone;
    if (props.address !== undefined) contact.address = props.address ?? null;
    return contact;
  }

  async delete(id: string): Promise<void> {
    this.contacts.delete(id);
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
