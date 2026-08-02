import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { ISoapNoteRepository } from '../../domain/repositories/ISoapNoteRepository';
import { IVisitDiagnosisRepository } from '../../domain/repositories/IVisitDiagnosisRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { IOdontogramRepository } from '../../domain/repositories/IOdontogramRepository';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { IConsentRepository } from '../../domain/repositories/IConsentRepository';
import { IReferralRepository } from '../../domain/repositories/IReferralRepository';
import { IFollowUpRepository } from '../../domain/repositories/IFollowUpRepository';
import { TimelineEventResponseDto } from '../dtos/TimelineEventResponseDto';

/**
 * docs/06-tasks/task-091.md: "aggregate all clinical events for a patient
 * across all visits into a single chronologically-ordered feed." The SAD's
 * Part 3.4 describes a full event-sourced architecture (timeline_events/
 * timeline_event_metadata/timeline_event_attachment/timeline_event_actor
 * tables, an Event Bus consumer, Redis caching) that is well beyond this
 * task's literal Backend Scope and Database Impact ("Read-only aggregate
 * query across visits, soap_notes, visit_treatments, prescriptions,
 * odontogram_entries, attachments, consents, referrals, follow_ups") --
 * scoped to a direct read-aggregation over the existing tables per that
 * literal Database Impact note, following this session's established
 * scope-narrowing precedent (Periodontal/Attachment/Consent).
 */
export class GetPatientTimelineUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly visitRepository: IVisitRepository,
    private readonly soapNoteRepository: ISoapNoteRepository,
    private readonly visitDiagnosisRepository: IVisitDiagnosisRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly prescriptionRepository: IPrescriptionRepository,
    private readonly odontogramRepository: IOdontogramRepository,
    private readonly attachmentRepository: IAttachmentRepository,
    private readonly consentRepository: IConsentRepository,
    private readonly referralRepository: IReferralRepository,
    private readonly followUpRepository: IFollowUpRepository,
  ) {}

  async execute(patientId: string): Promise<TimelineEventResponseDto[]> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const visits = await this.visitRepository.findByPatientId(patientId);
    const events: TimelineEventResponseDto[] = [];

    for (const visit of visits) {
      events.push({
        id: `visit-${visit.id}`,
        eventType: 'VISIT',
        visitId: visit.id,
        title: 'Visit Opened',
        description: visit.chiefComplaint,
        occurredAt: visit.visitDate.toISOString(),
        actorId: visit.createdBy,
      });

      const soapNote = await this.soapNoteRepository.findByVisitId(visit.id);
      if (soapNote && (soapNote.subjective || soapNote.objective || soapNote.assessment || soapNote.plan)) {
        events.push({
          id: `soap-${soapNote.id}`,
          eventType: 'SOAP',
          visitId: visit.id,
          title: 'SOAP Note Recorded',
          description: soapNote.assessment,
          occurredAt: soapNote.updatedAt.toISOString(),
          actorId: soapNote.updatedBy,
        });
      }

      const diagnoses = await this.visitDiagnosisRepository.findByVisitId(visit.id);
      for (const diagnosis of diagnoses) {
        events.push({
          id: `diagnosis-${diagnosis.id}`,
          eventType: 'DIAGNOSIS',
          visitId: visit.id,
          title: `Diagnosis Added: ${diagnosis.diagnosisName}`,
          description: diagnosis.notes,
          occurredAt: diagnosis.createdAt.toISOString(),
          actorId: diagnosis.createdBy,
        });
      }

      const treatments = await this.visitTreatmentRepository.findByVisitId(visit.id);
      for (const treatment of treatments) {
        events.push({
          id: `treatment-${treatment.id}`,
          eventType: 'TREATMENT',
          visitId: visit.id,
          title: 'Treatment Performed',
          description: treatment.notes,
          occurredAt: treatment.createdAt.toISOString(),
          actorId: treatment.createdBy,
        });
      }

      const referrals = await this.referralRepository.findByVisitId(visit.id);
      for (const referral of referrals) {
        events.push({
          id: `referral-${referral.id}`,
          eventType: 'REFERRAL',
          visitId: visit.id,
          title: `Referral Created: ${referral.targetType}`,
          description: referral.reason,
          occurredAt: referral.createdAt.toISOString(),
          actorId: referral.createdBy,
        });
      }

      const followUps = await this.followUpRepository.findByVisitId(visit.id);
      for (const followUp of followUps) {
        events.push({
          id: `follow-up-${followUp.id}`,
          eventType: 'FOLLOW_UP',
          visitId: visit.id,
          title: 'Follow Up Scheduled',
          description: followUp.note,
          occurredAt: followUp.createdAt.toISOString(),
          actorId: followUp.createdBy,
        });
      }
    }

    const prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
    for (const prescription of prescriptions) {
      events.push({
        id: `prescription-${prescription.id}`,
        eventType: 'PRESCRIPTION',
        visitId: prescription.visitId,
        title: 'Prescription Created',
        description: prescription.items.map((item) => item.medicineName).join(', ') || null,
        occurredAt: prescription.createdAt.toISOString(),
        actorId: prescription.createdBy,
      });
    }

    const odontogramEntries = await this.odontogramRepository.findAllByPatientId(patientId);
    for (const entry of odontogramEntries) {
      events.push({
        id: `odontogram-${entry.id}`,
        eventType: 'ODONTOGRAM',
        visitId: entry.visitId,
        title: `Odontogram Updated: Tooth ${entry.toothNumber}`,
        description: entry.note,
        occurredAt: entry.createdAt.toISOString(),
        actorId: entry.createdBy,
      });
    }

    const attachments = await this.attachmentRepository.findByPatientId(patientId, false);
    for (const attachment of attachments) {
      events.push({
        id: `attachment-${attachment.id}`,
        eventType: 'ATTACHMENT',
        visitId: attachment.visitId,
        title: `Attachment Uploaded: ${attachment.category}`,
        description: attachment.attachmentType,
        occurredAt: attachment.createdAt.toISOString(),
        actorId: attachment.createdBy,
      });
    }

    const consents = await this.consentRepository.findByPatientId(patientId);
    for (const consent of consents) {
      events.push({
        id: `consent-${consent.id}`,
        eventType: 'CONSENT',
        visitId: consent.visitId,
        title: consent.signedAt ? 'Consent Signed' : 'Consent Created',
        description: consent.procedure,
        occurredAt: (consent.signedAt ?? consent.createdAt).toISOString(),
        actorId: consent.createdBy,
      });
    }

    events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    return events;
  }
}
