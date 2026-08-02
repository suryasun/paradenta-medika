import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IFollowUpRepository } from '../../domain/repositories/IFollowUpRepository';
import { FollowUpResponseDto } from '../dtos/FollowUpResponseDto';
import { toFollowUpResponseDto } from '../mappers/FollowUpMapper';

export class GetFollowUpsUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly followUpRepository: IFollowUpRepository,
  ) {}

  async execute(visitId: string): Promise<FollowUpResponseDto[]> {
    const visit = await this.visitRepository.findById(visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }

    const followUps = await this.followUpRepository.findByVisitId(visitId);
    return followUps.map(toFollowUpResponseDto);
  }
}
