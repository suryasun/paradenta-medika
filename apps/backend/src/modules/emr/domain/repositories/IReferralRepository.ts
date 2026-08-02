import { Referral, ReferralTargetType } from '@prisma/client';

export interface CreateReferralInput {
  visitId: string;
  patientId: string;
  targetType: ReferralTargetType;
  reason: string;
  note?: string;
  createdBy: string;
}

export interface IReferralRepository {
  create(input: CreateReferralInput): Promise<Referral>;
  findByVisitId(visitId: string): Promise<Referral[]>;
}
