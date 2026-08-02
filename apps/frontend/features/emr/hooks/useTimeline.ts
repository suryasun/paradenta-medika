import { useQuery } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { TimelineEventType } from "../types/emr.types";

// docs/06-tasks/task-091.md.
export function usePatientTimeline(patientId: string) {
  return useQuery({
    queryKey: ["emr", "timeline", patientId],
    queryFn: () => emrService.getPatientTimeline(patientId),
    enabled: Boolean(patientId),
  });
}

// docs/06-tasks/task-092.md.
export function usePatientTimelineSummary(patientId: string) {
  return useQuery({
    queryKey: ["emr", "timeline", patientId, "summary"],
    queryFn: () => emrService.getPatientTimelineSummary(patientId),
    enabled: Boolean(patientId),
  });
}

// docs/06-tasks/task-093.md.
export function usePatientTimelineEvents(patientId: string, eventType?: TimelineEventType) {
  return useQuery({
    queryKey: ["emr", "timeline", patientId, "events", eventType ?? "ALL"],
    queryFn: () => emrService.getPatientTimelineEvents(patientId, eventType),
    enabled: Boolean(patientId),
  });
}

// docs/06-tasks/task-094.md.
export function usePatientTimelineAttachments(patientId: string) {
  return useQuery({
    queryKey: ["emr", "timeline", patientId, "attachments"],
    queryFn: () => emrService.getPatientTimelineAttachments(patientId),
    enabled: Boolean(patientId),
  });
}
