import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';
import { QueueScope } from '../services/resolveQueueScope';

export class GetQueueDetailUseCase {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async execute(id: string, scope: QueueScope = {}): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(id);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    // docs/06-tasks/task-311.md/task-312.md: a record outside the caller's
    // resolved scope reports "not found" (404), not "forbidden" (403), to
    // avoid confirming the existence of a cross-branch/other-doctor record.
    if (scope.allowedBranchIds && !scope.allowedBranchIds.includes(queue.branchId)) {
      throw new QueueNotFoundException();
    }
    if (scope.restrictToDoctorId && queue.doctorId !== scope.restrictToDoctorId) {
      throw new QueueNotFoundException();
    }
    return toQueueResponse(queue);
  }
}
