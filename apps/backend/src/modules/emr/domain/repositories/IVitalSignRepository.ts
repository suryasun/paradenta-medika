import { VitalSign } from '@prisma/client';

export interface RecordVitalSignInput {
  visitId: string;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  recordedBy: string;
}

export interface IVitalSignRepository {
  create(input: RecordVitalSignInput): Promise<VitalSign>;
  findByVisitId(visitId: string): Promise<VitalSign[]>;
}
