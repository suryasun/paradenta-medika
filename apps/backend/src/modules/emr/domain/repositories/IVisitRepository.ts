import { Visit } from '@prisma/client';

export interface CreateVisitInput {
  visitNo: string;
  reservationId?: string | null;
  patientId: string;
  doctorId: string;
  branchId: string;
  queueId: string;
  chiefComplaint?: string;
  createdBy: string;
}

export interface IVisitRepository {
  create(input: CreateVisitInput): Promise<Visit>;
  findById(id: string): Promise<Visit | null>;
  findByQueueId(queueId: string): Promise<Visit | null>;
  findByVisitNo(visitNo: string): Promise<Visit | null>;
  count(): Promise<number>;
  markCompleted(id: string, updatedBy: string): Promise<Visit>;
}
