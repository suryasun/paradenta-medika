import { Prescription, PrescriptionItem } from '@prisma/client';

export type PrescriptionWithItems = Prescription & { items: PrescriptionItem[] };

export interface PrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction?: string;
}

export interface CreatePrescriptionInput {
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItemInput[];
  createdBy: string;
}

export interface IPrescriptionRepository {
  create(input: CreatePrescriptionInput): Promise<PrescriptionWithItems>;
  findById(id: string): Promise<PrescriptionWithItems | null>;
  findByPatientId(patientId: string): Promise<PrescriptionWithItems[]>;
}
