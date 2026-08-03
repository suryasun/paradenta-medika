import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { buildPaginationMeta } from '../../../../shared/http/pagination';
import { AuthenticationException } from '../../../../shared/http/exceptions';
import { CreateJournalRequestDto, ReverseJournalRequestDto, UpdateJournalRequestDto, VoidJournalRequestDto } from '../../application/dtos/JournalRequestDto';
import { ListJournalQueryDto } from '../../application/dtos/JournalQueryDto';
import { CreateManualJournalUseCase } from '../../application/use-cases/CreateManualJournalUseCase';
import { ListJournalsUseCase } from '../../application/use-cases/ListJournalsUseCase';
import { GetJournalUseCase } from '../../application/use-cases/GetJournalUseCase';
import { UpdateJournalUseCase } from '../../application/use-cases/UpdateJournalUseCase';
import { PostJournalUseCase } from '../../application/use-cases/PostJournalUseCase';
import { ReverseJournalUseCase } from '../../application/use-cases/ReverseJournalUseCase';
import { VoidJournalUseCase } from '../../application/use-cases/VoidJournalUseCase';

export class JournalController {
  constructor(
    private readonly createManualJournalUseCase: CreateManualJournalUseCase,
    private readonly listJournalsUseCase: ListJournalsUseCase,
    private readonly getJournalUseCase: GetJournalUseCase,
    private readonly updateJournalUseCase: UpdateJournalUseCase,
    private readonly postJournalUseCase: PostJournalUseCase,
    private readonly reverseJournalUseCase: ReverseJournalUseCase,
    private readonly voidJournalUseCase: VoidJournalUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as CreateJournalRequestDto;
      const journal = await this.createManualJournalUseCase.execute({
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Journal created', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListJournalQueryDto;
      const { items, total } = await this.listJournalsUseCase.execute(query);
      sendSuccess(res, items, 'Journals retrieved', 200, buildPaginationMeta(query.page, query.limit, total));
    } catch (error) {
      next(error);
    }
  };

  detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const journal = await this.getJournalUseCase.execute(req.params.journalId);
      sendSuccess(res, journal, 'Journal retrieved');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as UpdateJournalRequestDto;
      const journal = await this.updateJournalUseCase.execute({
        journalId: req.params.journalId,
        ...body,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Journal updated');
    } catch (error) {
      next(error);
    }
  };

  post = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const journal = await this.postJournalUseCase.execute({
        journalId: req.params.journalId,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Journal posted');
    } catch (error) {
      next(error);
    }
  };

  reverse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as ReverseJournalRequestDto;
      const journal = await this.reverseJournalUseCase.execute({
        journalId: req.params.journalId,
        journalDate: body.journalDate,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Journal reversed');
    } catch (error) {
      next(error);
    }
  };

  void = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new AuthenticationException();
      const body = req.body as VoidJournalRequestDto;
      const journal = await this.voidJournalUseCase.execute({
        journalId: req.params.journalId,
        reason: body.reason,
        actorUserId: req.auth.userId,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });
      sendSuccess(res, journal, 'Journal voided');
    } catch (error) {
      next(error);
    }
  };
}
