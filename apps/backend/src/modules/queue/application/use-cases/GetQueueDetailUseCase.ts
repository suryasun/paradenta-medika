import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export class GetQueueDetailUseCase {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async execute(id: string): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(id);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    return toQueueResponse(queue);
  }
}
