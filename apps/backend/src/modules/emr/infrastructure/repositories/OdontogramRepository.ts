import { OdontogramEntry } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateOdontogramEntryInput, IOdontogramRepository } from '../../domain/repositories/IOdontogramRepository';

export class OdontogramRepository implements IOdontogramRepository {
  async create(input: CreateOdontogramEntryInput): Promise<OdontogramEntry> {
    return prisma.odontogramEntry.create({
      data: {
        visitId: input.visitId,
        patientId: input.patientId,
        toothNumber: input.toothNumber,
        surface: input.surface,
        toothConditionId: input.toothConditionId,
        note: input.note,
        createdBy: input.createdBy,
      },
    });
  }

  async findAllByPatientId(patientId: string): Promise<OdontogramEntry[]> {
    return prisma.odontogramEntry.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  }

  async findByPatientIdAndTooth(patientId: string, toothNumber: number): Promise<OdontogramEntry[]> {
    return prisma.odontogramEntry.findMany({
      where: { patientId, toothNumber },
      orderBy: { createdAt: 'asc' },
    });
  }
}
