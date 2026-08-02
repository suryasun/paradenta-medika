import { SoapNote } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ISoapNoteRepository, UpsertSoapNoteInput } from '../../domain/repositories/ISoapNoteRepository';

export class SoapNoteRepository implements ISoapNoteRepository {
  async upsert(input: UpsertSoapNoteInput): Promise<SoapNote> {
    return prisma.soapNote.upsert({
      where: { visitId: input.visitId },
      create: {
        visitId: input.visitId,
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        updatedBy: input.updatedBy,
      },
      update: {
        subjective: input.subjective,
        objective: input.objective,
        assessment: input.assessment,
        plan: input.plan,
        updatedBy: input.updatedBy,
      },
    });
  }

  async findByVisitId(visitId: string): Promise<SoapNote | null> {
    return prisma.soapNote.findUnique({ where: { visitId } });
  }
}
