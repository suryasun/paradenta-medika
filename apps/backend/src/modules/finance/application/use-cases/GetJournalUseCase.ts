import { JournalNotFoundException } from '../../domain/exceptions/FinanceExceptions';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export class GetJournalUseCase {
  constructor(private readonly journalRepository: IJournalRepository) {}

  async execute(journalId: string): Promise<JournalResponseDto> {
    const journal = await this.journalRepository.findById(journalId);
    if (!journal) {
      throw new JournalNotFoundException();
    }
    return toJournalResponseDto(journal);
  }
}
