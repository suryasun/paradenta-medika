import { BackgroundJob } from '@prisma/client';
import { IBackgroundJobRepository } from '../../domain/repositories/IBackgroundJobRepository';
import { BackgroundJobNotFoundException } from '../../domain/exceptions/SystemExceptions';

export class GetBackgroundJobUseCase {
  constructor(private readonly backgroundJobRepository: IBackgroundJobRepository) {}

  async execute(jobId: string): Promise<BackgroundJob> {
    const job = await this.backgroundJobRepository.findById(jobId);
    if (!job) {
      throw new BackgroundJobNotFoundException();
    }
    return job;
  }
}
