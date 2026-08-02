import { VitalSign } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IVitalSignRepository, RecordVitalSignInput } from '../../domain/repositories/IVitalSignRepository';

export class VitalSignRepository implements IVitalSignRepository {
  async create(input: RecordVitalSignInput): Promise<VitalSign> {
    return prisma.vitalSign.create({
      data: {
        visitId: input.visitId,
        bloodPressure: input.bloodPressure,
        heartRate: input.heartRate,
        respiratoryRate: input.respiratoryRate,
        temperature: input.temperature,
        weight: input.weight,
        height: input.height,
        oxygenSaturation: input.oxygenSaturation,
        recordedBy: input.recordedBy,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<VitalSign[]> {
    return prisma.vitalSign.findMany({ where: { visitId }, orderBy: { recordedAt: 'desc' } });
  }
}
