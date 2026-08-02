import { VisitDiagnosis } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateVisitDiagnosisInput, IVisitDiagnosisRepository } from '../../domain/repositories/IVisitDiagnosisRepository';

export class VisitDiagnosisRepository implements IVisitDiagnosisRepository {
  /**
   * MySQL's Prisma createMany does not return the created rows, so this
   * re-reads all diagnoses for the visit afterward (includes any recorded
   * earlier, which is what the caller -- RecordDiagnosisUseCase, called
   * once per Visit in practice -- wants to return anyway).
   */
  async createMany(inputs: CreateVisitDiagnosisInput[]): Promise<VisitDiagnosis[]> {
    await prisma.visitDiagnosis.createMany({
      data: inputs.map((input) => ({
        visitId: input.visitId,
        diagnosisType: input.diagnosisType,
        diagnosisName: input.diagnosisName,
        notes: input.notes,
        createdBy: input.createdBy,
      })),
    });
    return this.findByVisitId(inputs[0]?.visitId ?? '');
  }

  async findByVisitId(visitId: string): Promise<VisitDiagnosis[]> {
    return prisma.visitDiagnosis.findMany({ where: { visitId }, orderBy: { createdAt: 'asc' } });
  }
}
