import { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IProjectionCheckpointRepository } from '../../domain/repositories/IProjectionCheckpointRepository';

export class ProjectionCheckpointRepository implements IProjectionCheckpointRepository {
  async claim(consumerName: string, sourceKey: string): Promise<boolean> {
    try {
      await prisma.reportProjectionCheckpoint.create({ data: { consumerName, sourceKey } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }
}
