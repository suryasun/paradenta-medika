"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { getApiErrorMessage } from "@/lib/api-client";
import { usePatientTimelineAttachments, usePatientTimelineEvents, usePatientTimelineSummary } from "../hooks/useTimeline";
import { TIMELINE_EVENT_TYPES, TimelineEventType } from "../types/emr.types";
import { formatEnumLabel } from "../utils/formatEnumLabel";

// docs/06-tasks/task-091.md..task-094.md: Clinical Timeline view on Patient
// Detail -- a summary panel (task-092), a filterable chronological feed
// (task-091/093), and a cross-visit attachment gallery (task-094).
export function ClinicalTimelineSection({ patientId }: { patientId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <TimelineSummaryPanel patientId={patientId} />
      <TimelineFeed patientId={patientId} />
      <TimelineAttachmentGallery patientId={patientId} />
    </div>
  );
}

function TimelineSummaryPanel({ patientId }: { patientId: string }) {
  const { data: summary, isLoading, isError, error, refetch } = usePatientTimelineSummary(patientId);

  if (isLoading) return <LoadingState label="Loading summary..." cards={4} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!summary) return null;

  const hasAlerts = summary.activeAlerts.medicalHistory.length > 0 || summary.activeAlerts.allergies.length > 0;

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Clinical Summary</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Most Recent Visit</dt>
          <dd className="text-sm text-foreground">
            {summary.mostRecentVisit ? `${summary.mostRecentVisit.visitNo} (${new Date(summary.mostRecentVisit.visitDate).toLocaleDateString()})` : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Last Prescription</dt>
          <dd className="text-sm text-foreground">
            {summary.lastPrescription ? summary.lastPrescription.items.map((item) => item.medicineName).join(", ") : "-"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Active Alerts</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {!hasAlerts && <span className="text-sm text-muted">None on record</span>}
            {summary.activeAlerts.allergies.map((allergy) => (
              <Badge key={allergy.id} tone="error">
                Allergy: {allergy.allergen} ({allergy.severity})
              </Badge>
            ))}
            {summary.activeAlerts.medicalHistory.map((entry) => (
              <Badge key={entry.id} tone="warning">
                {formatEnumLabel(entry.category)}
              </Badge>
            ))}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Open Treatment Plan Items</dt>
          <dd className="text-sm text-foreground">
            {summary.openTreatmentPlanItems.length === 0 ? "None" : `${summary.openTreatmentPlanItems.length} item(s) not yet scheduled`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TimelineFeed({ patientId }: { patientId: string }) {
  const [eventType, setEventType] = useState<TimelineEventType | "">("");
  const { data: events, isLoading, isError, error, refetch } = usePatientTimelineEvents(patientId, eventType || undefined);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <Select
          id="timelineEventTypeFilter"
          label="Filter by Event Type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as TimelineEventType | "")}
          className="min-w-52"
        >
          <option value="">All Events</option>
          {TIMELINE_EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading timeline..." rows={4} columns={3} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && (!events || events.length === 0) && <EmptyState title="No clinical events recorded yet" />}
      {!isLoading && !isError && events && events.length > 0 && (
        <ol className="flex flex-col gap-2">
          {[...events].reverse().map((event) => (
            <li key={event.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{event.title}</span>
                <Badge tone="neutral">{formatEnumLabel(event.eventType)}</Badge>
              </div>
              <p className="text-xs text-muted">{new Date(event.occurredAt).toLocaleString()}</p>
              {event.description && <p className="mt-1 text-sm text-foreground">{event.description}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function TimelineAttachmentGallery({ patientId }: { patientId: string }) {
  const { data: attachments, isLoading, isError, error, refetch } = usePatientTimelineAttachments(patientId);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">Attachment Gallery</h2>
      {isLoading && <LoadingState label="Loading attachments..." cards={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && (!attachments || attachments.length === 0) && <EmptyState title="No attachments across any visit yet" />}
      {!isLoading && !isError && attachments && attachments.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="rounded-md border border-border p-3 text-sm">
              <Badge tone="neutral">{formatEnumLabel(attachment.category)}</Badge>
              <p className="mt-1 truncate text-foreground">{attachment.currentVersion?.fileName ?? "-"}</p>
              <p className="text-xs text-muted">{new Date(attachment.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
