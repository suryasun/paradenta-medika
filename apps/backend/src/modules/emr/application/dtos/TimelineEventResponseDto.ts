/**
 * docs/06-tasks/task-091.md Business Goal literal list (SOAP notes,
 * diagnoses, treatments, prescriptions, odontogram changes, attachments,
 * consents, referrals) + Depends On (task-090 Follow Up) + Database
 * Impact's `visits` table -- the literal set of event sources this task
 * asks for. Does NOT include Medical Certificate (Epic S) or Periodontal
 * Assessment: neither is named in task-091's Depends On/Database Impact,
 * so adding them would be scope invention beyond the literal task text.
 */
export type TimelineEventType =
  | 'VISIT'
  | 'SOAP'
  | 'DIAGNOSIS'
  | 'TREATMENT'
  | 'PRESCRIPTION'
  | 'ODONTOGRAM'
  | 'ATTACHMENT'
  | 'CONSENT'
  | 'REFERRAL'
  | 'FOLLOW_UP';

export interface TimelineEventResponseDto {
  id: string;
  eventType: TimelineEventType;
  visitId: string;
  title: string;
  description: string | null;
  occurredAt: string;
  actorId: string | null;
}
