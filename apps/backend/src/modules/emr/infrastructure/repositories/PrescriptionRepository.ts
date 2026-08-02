import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreatePrescriptionInput, IPrescriptionRepository, PrescriptionWithItems } from '../../domain/repositories/IPrescriptionRepository';

export class PrescriptionRepository implements IPrescriptionRepository {
  async create(input: CreatePrescriptionInput): Promise<PrescriptionWithItems> {
    return prisma.prescription.create({
      data: {
        visitId: input.visitId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instruction: item.instruction,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findById(id: string): Promise<PrescriptionWithItems | null> {
    return prisma.prescription.findUnique({ where: { id }, include: { items: true } });
  }

  async findByPatientId(patientId: string): Promise<PrescriptionWithItems[]> {
    return prisma.prescription.findMany({
      where: { patientId },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
