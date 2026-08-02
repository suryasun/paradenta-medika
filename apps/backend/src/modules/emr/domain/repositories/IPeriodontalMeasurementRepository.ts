import { PeriodontalMeasurement, PeriodontalMeasurementPoint } from '@prisma/client';

export interface CreatePeriodontalMeasurementInput {
  assessmentId: string;
  toothNumber: number;
  measurementPoint: PeriodontalMeasurementPoint;
  pocketDepth: number;
  gingivalMargin: number;
  cal: number;
  bleeding: boolean;
  plaqueIndex?: number;
  mobility?: number;
  furcation?: string;
  createdBy: string;
}

export type UpdatePeriodontalMeasurementInput = Partial<
  Omit<CreatePeriodontalMeasurementInput, 'assessmentId' | 'createdBy'>
> & { updatedBy: string };

export interface IPeriodontalMeasurementRepository {
  create(input: CreatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement>;
  findById(id: string): Promise<PeriodontalMeasurement | null>;
  findByAssessmentId(assessmentId: string): Promise<PeriodontalMeasurement[]>;
  update(id: string, input: UpdatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement>;
  softDelete(id: string, deletedBy: string): Promise<void>;
}
