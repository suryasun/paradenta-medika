import { OdontogramEntry } from '@prisma/client';

export interface CreateOdontogramEntryInput {
  visitId: string;
  patientId: string;
  toothNumber: number;
  surface?: string;
  toothConditionId: string;
  note?: string;
  createdBy: string;
}

export interface IOdontogramRepository {
  create(input: CreateOdontogramEntryInput): Promise<OdontogramEntry>;
  findAllByPatientId(patientId: string): Promise<OdontogramEntry[]>;
  findByPatientIdAndTooth(patientId: string, toothNumber: number): Promise<OdontogramEntry[]>;
}
