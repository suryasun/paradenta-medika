"use client";

import { FormEvent, useState } from "react";
import { Archive, Download, Eye, Plus, RotateCcw, Upload } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { API_BASE_URL } from "@/config/env";
import {
  useAnnotateAttachment,
  useArchiveAttachment,
  useAttachmentDetail,
  useAttachmentVersions,
  useDownloadAttachment,
  useRestoreAttachmentVersion,
  useUploadAttachment,
  useVisitAttachments,
} from "../hooks/useAttachments";
import { ATTACHMENT_CATEGORIES, Attachment, AttachmentCategory, isAttachmentAnnotatable } from "../types/emr.types";
import { formatEnumLabel } from "../utils/formatEnumLabel";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// docs/06-tasks/task-078.md: no S3/MinIO instance is provisioned yet
// (documented gap, resolved as a local-filesystem stand-in behind the same
// object-storage interface -- see apps/backend/src/shared/storage/). This
// UI works against whichever implementation the backend is configured
// with.
export function AttachmentSection({ visitId, patientId, readOnly }: { visitId: string; patientId: string; readOnly: boolean }) {
  const { data: attachments, isLoading, isError, error, refetch } = useVisitAttachments(visitId);
  const [category, setCategory] = useState<AttachmentCategory>("CLINICAL_PHOTOGRAPHY");
  const [attachmentType, setAttachmentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const uploadAttachment = useUploadAttachment(visitId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    uploadAttachment.mutate(
      { visitId, patientId, category, attachmentType: attachmentType || undefined, file },
      { onSuccess: () => { setAttachmentType(""); setFile(null); } },
    );
  }

  if (isLoading) return <LoadingState label="Loading attachments..." rows={3} columns={6} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      {!attachments || attachments.length === 0 ? (
        <EmptyState
          title="No attachments uploaded yet"
          description={!readOnly ? "Use the form below to upload the first file." : undefined}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>File</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Size</TableHeaderCell>
              <TableHeaderCell>Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attachments.map((attachment: Attachment) => (
              <TableRow key={attachment.id}>
                <TableCell>{formatEnumLabel(attachment.category)}</TableCell>
                <TableCell>{attachment.currentVersion?.fileName ?? "-"}</TableCell>
                <TableCell>{attachment.attachmentType ?? "-"}</TableCell>
                <TableCell>v{attachment.currentVersion?.versionNumber ?? "-"}</TableCell>
                <TableCell>{attachment.currentVersion ? formatFileSize(attachment.currentVersion.fileSize) : "-"}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    onClick={() => setSelectedAttachmentId(attachment.id)}
                  >
                    <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!readOnly && (
        <PermissionGuard permission="emr.attachment.upload">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
            <Select id="attachmentCategory" label="Category" value={category} onChange={(e) => setCategory(e.target.value as AttachmentCategory)}>
              {ATTACHMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {formatEnumLabel(c)}
                </option>
              ))}
            </Select>
            <Input
              id="attachmentType"
              label="Type (optional)"
              placeholder="e.g. Periapical"
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value)}
              className="min-w-40"
            />
            <Input
              id="attachmentFile"
              label="File"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button type="submit" isLoading={uploadAttachment.isPending} disabled={!file}>
              <Upload size={14} strokeWidth={1.75} aria-hidden="true" />
              Upload
            </Button>
            {uploadAttachment.isError && (
              <p role="alert" className="w-full text-sm text-error">
                {getApiErrorMessage(uploadAttachment.error)}
              </p>
            )}
          </form>
        </PermissionGuard>
      )}

      {selectedAttachmentId && (
        <AttachmentDetailModal
          visitId={visitId}
          patientId={patientId}
          attachmentId={selectedAttachmentId}
          readOnly={readOnly}
          onClose={() => setSelectedAttachmentId(null)}
        />
      )}
    </div>
  );
}

function AttachmentDetailModal({
  attachmentId,
  readOnly,
  onClose,
}: {
  visitId: string;
  patientId: string;
  attachmentId: string;
  readOnly: boolean;
  onClose: () => void;
}) {
  const { data: attachment, isLoading, isError, error } = useAttachmentDetail(attachmentId);
  const { data: versions } = useAttachmentVersions(attachmentId);
  const downloadAttachment = useDownloadAttachment();
  const archiveAttachment = useArchiveAttachment(attachment?.visitId ?? "");
  const annotateAttachment = useAnnotateAttachment(attachmentId);
  const restoreVersion = useRestoreAttachmentVersion(attachmentId);
  const [shape, setShape] = useState("circle");
  const [positionX, setPositionX] = useState("");
  const [positionY, setPositionY] = useState("");
  const [text, setText] = useState("");

  function handleDownload() {
    downloadAttachment.mutate(attachmentId, {
      onSuccess: (result) => {
        const origin = new URL(API_BASE_URL).origin;
        window.open(new URL(result.url, origin).toString(), "_blank", "noopener,noreferrer");
      },
    });
  }

  function handleAnnotate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!positionX || !positionY) return;
    annotateAttachment.mutate(
      { shape, positionX: Number(positionX), positionY: Number(positionY), text: text || undefined },
      { onSuccess: () => { setPositionX(""); setPositionY(""); setText(""); } },
    );
  }

  return (
    <Modal title="Attachment Detail" onClose={onClose}>
      {isLoading && <LoadingState label="Loading attachment..." rows={3} columns={1} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} />}
      {attachment && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-sm">
            <p>
              <span className="font-medium">Category:</span> {formatEnumLabel(attachment.category)}
            </p>
            <p>
              <span className="font-medium">File:</span> {attachment.currentVersion?.fileName}
            </p>
            <p>
              <span className="font-medium">Version:</span> {attachment.currentVersion?.versionNumber}
            </p>
            {attachment.archivedAt && <Badge tone="neutral">Archived</Badge>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" isLoading={downloadAttachment.isPending} onClick={handleDownload}>
              <Download size={14} strokeWidth={1.75} aria-hidden="true" />
              Download
            </Button>
            {!readOnly && !attachment.archivedAt && (
              <PermissionGuard permission="emr.attachment.archive">
                <Button type="button" variant="danger" isLoading={archiveAttachment.isPending} onClick={() => archiveAttachment.mutate(attachmentId)}>
                  <Archive size={14} strokeWidth={1.75} aria-hidden="true" />
                  Archive
                </Button>
              </PermissionGuard>
            )}
          </div>

          {versions && versions.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Version History</p>
              <ul className="flex flex-col gap-1 text-sm">
                {versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between rounded-md border border-border p-2">
                    <span>
                      v{version.versionNumber} — {version.fileName}
                    </span>
                    {!readOnly && version.versionNumber !== attachment.currentVersion?.versionNumber && (
                      <PermissionGuard permission="emr.attachment.restore">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          onClick={() => restoreVersion.mutate(version.versionNumber)}
                        >
                          <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
                          Restore
                        </button>
                      </PermissionGuard>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isAttachmentAnnotatable(attachment.category) && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Annotations</p>
              {attachment.annotations.length === 0 ? (
                <p className="text-sm text-muted">No annotations yet</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {attachment.annotations.map((annotation) => (
                    <li key={annotation.id}>
                      {annotation.shape} at ({annotation.positionX}, {annotation.positionY}){annotation.text ? ` — ${annotation.text}` : ""}
                    </li>
                  ))}
                </ul>
              )}

              {!readOnly && (
                <PermissionGuard permission="emr.attachment.annotate">
                  <form onSubmit={handleAnnotate} className="mt-2 flex flex-wrap items-end gap-2">
                    <Select id="annotationShape" label="Shape" value={shape} onChange={(e) => setShape(e.target.value)}>
                      <option value="circle">Circle</option>
                      <option value="rect">Rectangle</option>
                      <option value="arrow">Arrow</option>
                      <option value="text">Text</option>
                    </Select>
                    <Input id="annotationX" label="X" type="number" value={positionX} onChange={(e) => setPositionX(e.target.value)} className="w-20" />
                    <Input id="annotationY" label="Y" type="number" value={positionY} onChange={(e) => setPositionY(e.target.value)} className="w-20" />
                    <Input id="annotationText" label="Text (optional)" value={text} onChange={(e) => setText(e.target.value)} />
                    <Button type="submit" isLoading={annotateAttachment.isPending} disabled={!positionX || !positionY}>
                      <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                      Add
                    </Button>
                  </form>
                </PermissionGuard>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
