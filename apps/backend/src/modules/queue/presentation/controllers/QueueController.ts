import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException, ValidationException } from '../../../../shared/http/exceptions';
import { CreateQueueRequestDto } from '../../application/dtos/CreateQueueRequestDto';
import { ListQueueQueryDto } from '../../application/dtos/ListQueueQueryDto';
import { TransferQueueRequestDto } from '../../application/dtos/TransferQueueRequestDto';
import { CancelQueueRequestDto } from '../../application/dtos/CancelQueueRequestDto';
import { CreateQueueUseCase } from '../../application/use-cases/CreateQueueUseCase';
import { ListQueueUseCase } from '../../application/use-cases/ListQueueUseCase';
import { GetQueueDetailUseCase } from '../../application/use-cases/GetQueueDetailUseCase';
import { CallQueueUseCase } from '../../application/use-cases/CallQueueUseCase';
import { RecallQueueUseCase } from '../../application/use-cases/RecallQueueUseCase';
import { SkipQueueUseCase } from '../../application/use-cases/SkipQueueUseCase';
import { StartServiceUseCase } from '../../application/use-cases/StartServiceUseCase';
import { CompleteQueueUseCase } from '../../application/use-cases/CompleteQueueUseCase';
import { CancelQueueUseCase } from '../../application/use-cases/CancelQueueUseCase';
import { TransferQueueUseCase } from '../../application/use-cases/TransferQueueUseCase';

export class QueueController {
  constructor(
    private readonly createQueueUseCase: CreateQueueUseCase,
    private readonly listQueueUseCase: ListQueueUseCase,
    private readonly getQueueDetailUseCase: GetQueueDetailUseCase,
    private readonly callQueueUseCase: CallQueueUseCase,
    private readonly recallQueueUseCase: RecallQueueUseCase,
    private readonly skipQueueUseCase: SkipQueueUseCase,
    private readonly startServiceUseCase: StartServiceUseCase,
    private readonly completeQueueUseCase: CompleteQueueUseCase,
    private readonly cancelQueueUseCase: CancelQueueUseCase,
    private readonly transferQueueUseCase: TransferQueueUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateQueueRequestDto;
      const queue = await this.createQueueUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, queue, 'Queue created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListQueueQueryDto;
      const { items, total } = await this.listQueueUseCase.execute(query);
      sendSuccess(res, items, 'Queues retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queue = await this.getQueueDetailUseCase.execute(req.params.id);
      sendSuccess(res, queue, 'Queue retrieved');
    } catch (error) {
      next(error);
    }
  };

  call = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const queue = await this.callQueueUseCase.execute({ queueId: req.params.id, actorUserId: req.auth.userId, ipAddress: req.ip, correlationId: req.correlationId });
      sendSuccess(res, queue, 'Queue called');
    } catch (error) {
      next(error);
    }
  };

  recall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const queue = await this.recallQueueUseCase.execute({ queueId: req.params.id, actorUserId: req.auth.userId });
      sendSuccess(res, queue, 'Queue recalled');
    } catch (error) {
      next(error);
    }
  };

  skip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CancelQueueRequestDto;
      const queue = await this.skipQueueUseCase.execute({
        queueId: req.params.id,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, queue, 'Queue skipped');
    } catch (error) {
      next(error);
    }
  };

  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const queue = await this.startServiceUseCase.execute({ queueId: req.params.id, actorUserId: req.auth.userId, ipAddress: req.ip, correlationId: req.correlationId });
      sendSuccess(res, queue, 'Service started');
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const queue = await this.completeQueueUseCase.execute({ queueId: req.params.id, actorUserId: req.auth.userId, ipAddress: req.ip, correlationId: req.correlationId });
      sendSuccess(res, queue, 'Queue completed');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CancelQueueRequestDto;
      const queue = await this.cancelQueueUseCase.execute({
        queueId: req.params.id,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, queue, 'Queue cancelled');
    } catch (error) {
      next(error);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as TransferQueueRequestDto;
      if (!body.doctorId) {
        throw new ValidationException([{ field: 'doctorId', message: 'doctorId is required to transfer a queue' }]);
      }
      const queue = await this.transferQueueUseCase.execute({
        queueId: req.params.id,
        doctorId: body.doctorId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, queue, 'Queue transferred');
    } catch (error) {
      next(error);
    }
  };
}
