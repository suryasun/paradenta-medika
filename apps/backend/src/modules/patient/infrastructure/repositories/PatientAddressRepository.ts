import { PatientAddress } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreatePatientAddressProps,
  IPatientAddressRepository,
  UpdatePatientAddressProps,
} from '../../domain/repositories/IPatientAddressRepository';

export class PatientAddressRepository implements IPatientAddressRepository {
  async listForPatient(patientId: string): Promise<PatientAddress[]> {
    return prisma.patientAddress.findMany({ where: { patientId }, orderBy: [{ isPrimary: 'desc' }] });
  }

  async findById(id: string): Promise<PatientAddress | null> {
    return prisma.patientAddress.findUnique({ where: { id } });
  }

  async countForPatient(patientId: string): Promise<number> {
    return prisma.patientAddress.count({ where: { patientId } });
  }

  async create(props: CreatePatientAddressProps): Promise<PatientAddress> {
    return prisma.patientAddress.create({ data: props });
  }

  async update(id: string, props: UpdatePatientAddressProps): Promise<PatientAddress> {
    return prisma.patientAddress.update({ where: { id }, data: props });
  }

  async delete(id: string): Promise<void> {
    await prisma.patientAddress.delete({ where: { id } });
  }

  async setPrimary(patientId: string, addressId: string): Promise<PatientAddress> {
    return prisma.$transaction(async (tx) => {
      await tx.patientAddress.updateMany({
        where: { patientId, isPrimary: true, id: { not: addressId } },
        data: { isPrimary: false },
      });
      return tx.patientAddress.update({ where: { id: addressId }, data: { isPrimary: true } });
    });
  }
}
