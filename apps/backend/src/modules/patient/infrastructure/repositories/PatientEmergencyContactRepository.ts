import { PatientEmergencyContact } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreatePatientEmergencyContactProps,
  IPatientEmergencyContactRepository,
  UpdatePatientEmergencyContactProps,
} from '../../domain/repositories/IPatientEmergencyContactRepository';

export class PatientEmergencyContactRepository implements IPatientEmergencyContactRepository {
  async listForPatient(patientId: string): Promise<PatientEmergencyContact[]> {
    return prisma.patientEmergencyContact.findMany({ where: { patientId } });
  }

  async findById(id: string): Promise<PatientEmergencyContact | null> {
    return prisma.patientEmergencyContact.findUnique({ where: { id } });
  }

  async create(props: CreatePatientEmergencyContactProps): Promise<PatientEmergencyContact> {
    return prisma.patientEmergencyContact.create({ data: props });
  }

  async update(id: string, props: UpdatePatientEmergencyContactProps): Promise<PatientEmergencyContact> {
    return prisma.patientEmergencyContact.update({ where: { id }, data: props });
  }

  async delete(id: string): Promise<void> {
    await prisma.patientEmergencyContact.delete({ where: { id } });
  }
}
