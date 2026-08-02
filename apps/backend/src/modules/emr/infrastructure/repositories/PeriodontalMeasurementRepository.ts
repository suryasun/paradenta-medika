import { PeriodontalMeasurement } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreatePeriodontalMeasurementInput,
  IPeriodontalMeasurementRepository,
  UpdatePeriodontalMeasurementInput,
} from '../../domain/repositories/IPeriodontalMeasurementRepository';

export class PeriodontalMeasurementRepository implements IPeriodontalMeasurementRepository {
  async create(input: CreatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement> {
    return prisma.periodontalMeasurement.create({
      data: {
        assessmentId: input.assessmentId,
        toothNumber: input.toothNumber,
        measurementPoint: input.measurementPoint,
        pocketDepth: input.pocketDepth,
        gingivalMargin: input.gingivalMargin,
        cal: input.cal,
        bleeding: input.bleeding,
        plaqueIndex: input.plaqueIndex,
        mobility: input.mobility,
        furcation: input.furcation,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<PeriodontalMeasurement | null> {
    return prisma.periodontalMeasurement.findFirst({ where: { id, deletedAt: null } });
  }

  async findByAssessmentId(assessmentId: string): Promise<PeriodontalMeasurement[]> {
    return prisma.periodontalMeasurement.findMany({
      where: { assessmentId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, input: UpdatePeriodontalMeasurementInput): Promise<PeriodontalMeasurement> {
    return prisma.periodontalMeasurement.update({
      where: { id },
      data: {
        toothNumber: input.toothNumber,
        measurementPoint: input.measurementPoint,
        pocketDepth: input.pocketDepth,
        gingivalMargin: input.gingivalMargin,
        cal: input.cal,
        bleeding: input.bleeding,
        plaqueIndex: input.plaqueIndex,
        mobility: input.mobility,
        furcation: input.furcation,
        updatedBy: input.updatedBy,
      },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await prisma.periodontalMeasurement.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
    });
  }
}
