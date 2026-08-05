import { ReferralSource } from '@prisma/client';
import { IReferralSourceRepository } from '../../domain/repositories/IReferralSourceRepository';

export class ListReferralSourcesUseCase {
  constructor(private readonly referralSourceRepository: IReferralSourceRepository) {}

  async execute(): Promise<ReferralSource[]> {
    return this.referralSourceRepository.list();
  }
}
