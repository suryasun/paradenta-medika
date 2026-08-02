import { Allergy } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateAllergyInput, IAllergyRepository } from '../../domain/repositories/IAllergyRepository';

export class AllergyRepository implements IAllergyRepository {
  async create(input: CreateAllergyInput): Promise<Allergy> {
    return prisma.allergy.create({
      data: {
        patientId: input.patientId,
        visitId: input.visitId,
        type: input.type,
        allergen: input.allergen,
        severity: input.severity,
        reaction: input.reaction,
        notes: input.notes,
        createdBy: input.createdBy,
      },
    });
  }

  async findByPatientId(patientId: string): Promise<Allergy[]> {
    return prisma.allergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
