import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IReferralRepository } from '../../domain/repositories/IReferralRepository';
import { ReferralResponseDto } from '../dtos/ReferralResponseDto';
import { toReferralResponseDto } from '../mappers/ReferralMapper';

/** docs/06-tasks/task-089.md Acceptance Criteria: "Referral created and retrievable." */
export class GetReferralsUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly referralRepository: IReferralRepository,
  ) {}

  async execute(visitId: string): Promise<ReferralResponseDto[]> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }

    const referrals = await this.referralRepository.findByVisitId(visitId);
    return referrals.map(toReferralResponseDto);
  }
}
