import { PatientAddress } from '@prisma/client';

export interface CreatePatientAddressProps {
  patientId: string;
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
  addressLine: string;
  postalCode?: string;
  isPrimary: boolean;
}

export type UpdatePatientAddressProps = Partial<Omit<CreatePatientAddressProps, 'patientId'>>;

// task-286 (Epic PE3): exactly one isPrimary:true row per patient is an
// application-layer invariant (MySQL cannot express "exactly one true per
// group" declaratively) -- see the use cases for how each method here is
// composed to preserve it.
export interface IPatientAddressRepository {
  listForPatient(patientId: string): Promise<PatientAddress[]>;
  findById(id: string): Promise<PatientAddress | null>;
  countForPatient(patientId: string): Promise<number>;
  create(props: CreatePatientAddressProps): Promise<PatientAddress>;
  update(id: string, props: UpdatePatientAddressProps): Promise<PatientAddress>;
  delete(id: string): Promise<void>;
  /** Atomically flips every other address for this patient to isPrimary:false and this one to true. */
  setPrimary(patientId: string, addressId: string): Promise<PatientAddress>;
}
