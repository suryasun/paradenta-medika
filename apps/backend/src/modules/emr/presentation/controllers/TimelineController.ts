import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../../shared/http/ApiResponse';
import { GetPatientTimelineUseCase } from '../../application/use-cases/GetPatientTimelineUseCase';
import { GetPatientTimelineSummaryUseCase } from '../../application/use-cases/GetPatientTimelineSummaryUseCase';
import { GetPatientTimelineEventsUseCase } from '../../application/use-cases/GetPatientTimelineEventsUseCase';
import { GetPatientTimelineAttachmentsUseCase } from '../../application/use-cases/GetPatientTimelineAttachmentsUseCase';
import { GetTimelineEventsQueryDto } from '../../application/dtos/GetTimelineEventsQueryDto';
import { TimelineEventType } from '../../application/dtos/TimelineEventResponseDto';

export class TimelineController {
  constructor(
    private readonly getPatientTimelineUseCase: GetPatientTimelineUseCase,
    private readonly getPatientTimelineSummaryUseCase: GetPatientTimelineSummaryUseCase,
    private readonly getPatientTimelineEventsUseCase: GetPatientTimelineEventsUseCase,
    private readonly getPatientTimelineAttachmentsUseCase: GetPatientTimelineAttachmentsUseCase,
  ) {}

  timeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await this.getPatientTimelineUseCase.execute(req.params.patientId);
      sendSuccess(res, events, 'Timeline retrieved');
    } catch (error) {
      next(error);
    }
  };

  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.getPatientTimelineSummaryUseCase.execute(req.params.patientId);
      sendSuccess(res, summary, 'Timeline summary retrieved');
    } catch (error) {
      next(error);
    }
  };

  events = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as GetTimelineEventsQueryDto;
      const events = await this.getPatientTimelineEventsUseCase.execute(req.params.patientId, query.eventType as unknown as TimelineEventType);
      sendSuccess(res, events, 'Timeline events retrieved');
    } catch (error) {
      next(error);
    }
  };

  attachments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const attachments = await this.getPatientTimelineAttachmentsUseCase.execute(req.params.patientId);
      sendSuccess(res, attachments, 'Timeline attachments retrieved');
    } catch (error) {
      next(error);
    }
  };
}
