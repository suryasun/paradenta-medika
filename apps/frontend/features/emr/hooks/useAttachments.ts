import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emrService } from "../services/emr.service";
import { AnnotateAttachmentInput, UploadAttachmentInput } from "../types/emr.types";

// docs/06-tasks/task-078.md..task-084.md.
export function useVisitAttachments(visitId: string) {
  return useQuery({
    queryKey: ["emr", "attachments", "visit", visitId],
    queryFn: () => emrService.listVisitAttachments(visitId),
    enabled: Boolean(visitId),
  });
}

export function useUploadAttachment(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadAttachmentInput) => emrService.uploadAttachment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "attachments", "visit", visitId] }),
  });
}

export function useAttachmentDetail(id: string | null) {
  return useQuery({
    queryKey: ["emr", "attachment", id],
    queryFn: () => emrService.getAttachmentDetail(id as string),
    enabled: id !== null,
  });
}

export function useAttachmentVersions(id: string | null) {
  return useQuery({
    queryKey: ["emr", "attachment", id, "versions"],
    queryFn: () => emrService.getAttachmentVersions(id as string),
    enabled: id !== null,
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (id: string) => emrService.downloadAttachment(id),
  });
}

export function useAnnotateAttachment(attachmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AnnotateAttachmentInput) => emrService.annotateAttachment(attachmentId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emr", "attachment", attachmentId] }),
  });
}

export function useArchiveAttachment(visitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emrService.archiveAttachment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["emr", "attachments", "visit", visitId] });
      queryClient.invalidateQueries({ queryKey: ["emr", "attachment", id] });
    },
  });
}

export function useRestoreAttachmentVersion(attachmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionNumber: number) => emrService.restoreAttachmentVersion(attachmentId, versionNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emr", "attachment", attachmentId] });
      queryClient.invalidateQueries({ queryKey: ["emr", "attachment", attachmentId, "versions"] });
    },
  });
}
