import { GetPatientTimelineUseCase } from './GetPatientTimelineUseCase';
import { TimelineEventResponseDto, TimelineEventType } from '../dtos/TimelineEventResponseDto';

/**
 * docs/06-tasks/task-093.md: "supporting an event-type filter parameter
 * over the same aggregated data as task-091" -- reuses
 * GetPatientTimelineUseCase in-process rather than duplicating the
 * aggregation query, per this session's established use-case-reuse pattern.
 */
export class GetPatientTimelineEventsUseCase {
  constructor(private readonly getPatientTimelineUseCase: GetPatientTimelineUseCase) {}

  async execute(patientId: string, eventType?: TimelineEventType): Promise<TimelineEventResponseDto[]> {
    const events = await this.getPatientTimelineUseCase.execute(patientId);
    if (!eventType) {
      return events;
    }
    return events.filter((event) => event.eventType === eventType);
  }
}
