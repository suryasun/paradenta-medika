"use client";

import { FormEvent, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateNotificationTemplate, useNotificationTemplates, usePreviewNotificationTemplate } from "../hooks/useNotification";
import { NotificationChannel, NotificationTemplate } from "../types/system.types";

const CHANNELS: NotificationChannel[] = ["EMAIL", "SMS", "IN_APP"];

// Templates are immutable/versioned server-side (unique on
// (templateKey, version), no update route) -- "editing" a template means
// creating a new version, so this page has no Edit action, only Create.
export function NotificationTemplatesPage() {
  const { data, isLoading, isError, error, refetch } = useNotificationTemplates();
  const [showCreate, setShowCreate] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<NotificationTemplate | null>(null);

  const createAction = (
    <PermissionGuard permission="system.notification-template.manage">
      <Button onClick={() => setShowCreate(true)}>
        <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
        New Template
      </Button>
    </PermissionGuard>
  );

  if (isLoading) return <LoadingState label="Loading notification templates..." rows={4} columns={5} />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;

  const templates = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Notification Templates</h1>
        {createAction}
      </div>

      {templates.length === 0 ? (
        <EmptyState title="No notification templates yet" description="Create the first template." action={createAction} />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Key</TableHeaderCell>
              <TableHeaderCell>Channel</TableHeaderCell>
              <TableHeaderCell>Locale</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.templateKey}</TableCell>
                <TableCell>
                  <Badge tone="neutral">{template.channel}</Badge>
                </TableCell>
                <TableCell>{template.locale}</TableCell>
                <TableCell className="font-tabular">v{template.version}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    onClick={() => setPreviewingTemplate(template)}
                  >
                    <Eye size={13} strokeWidth={1.75} aria-hidden="true" />
                    Preview
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateTemplateModal onClose={() => setShowCreate(false)} />}
      {previewingTemplate && <PreviewTemplateModal template={previewingTemplate} onClose={() => setPreviewingTemplate(null)} />}
    </div>
  );
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const [templateKey, setTemplateKey] = useState("");
  const [channel, setChannel] = useState<NotificationChannel>("EMAIL");
  const [locale, setLocale] = useState("id-ID");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [variableSchema, setVariableSchema] = useState("");
  const createTemplate = useCreateNotificationTemplate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!templateKey.trim() || !locale.trim() || !body.trim()) return;
    const variables = variableSchema
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    createTemplate.mutate(
      { templateKey, channel, locale, subject: subject || undefined, body, variableSchema: variables },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal title="New Notification Template" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input id="templateKey" label="Template Key" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} required />
        <Select id="templateChannel" label="Channel" value={channel} onChange={(e) => setChannel(e.target.value as NotificationChannel)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input id="templateLocale" label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)} required />
        {channel === "EMAIL" && <Input id="templateSubject" label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />}
        <Textarea id="templateBody" label="Body" value={body} onChange={(e) => setBody(e.target.value)} required />
        <Input
          id="templateVariables"
          label="Variables (comma-separated)"
          placeholder="e.g. patientName, visitDate"
          value={variableSchema}
          onChange={(e) => setVariableSchema(e.target.value)}
        />

        {createTemplate.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createTemplate.error)}
          </p>
        )}
        <Button type="submit" isLoading={createTemplate.isPending} disabled={!templateKey.trim() || !locale.trim() || !body.trim()}>
          Create Template
        </Button>
      </form>
    </Modal>
  );
}

function PreviewTemplateModal({ template, onClose }: { template: NotificationTemplate; onClose: () => void }) {
  const [payloadJson, setPayloadJson] = useState("{}");
  const previewTemplate = usePreviewNotificationTemplate();

  function handlePreview() {
    let payload: Record<string, unknown> | undefined;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      return;
    }
    previewTemplate.mutate({ templateId: template.id, payload });
  }

  return (
    <Modal title={`Preview — ${template.templateKey}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Textarea id="previewPayload" label="Payload (JSON)" value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} />
        <Button type="button" isLoading={previewTemplate.isPending} onClick={handlePreview}>
          Render Preview
        </Button>
        {previewTemplate.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(previewTemplate.error)}
          </p>
        )}
        {previewTemplate.data && (
          <div className="rounded-md border border-border bg-slate-50 p-3 text-sm">
            {previewTemplate.data.subject && <p className="mb-1 font-semibold">{previewTemplate.data.subject}</p>}
            <p className="whitespace-pre-wrap">{previewTemplate.data.body}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
