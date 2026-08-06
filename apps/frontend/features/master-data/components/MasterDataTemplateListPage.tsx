"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import { clinicService } from "../services/clinic.service";
import { useMasterDataTemplates } from "../hooks/useMasterDataTemplates";
import { useCreateMasterDataTemplate } from "../hooks/useMasterDataTemplateMutations";
import { REAL_ENTITY_TEMPLATE_TYPES } from "../types/masterData.types";

const CUSTOM_ENTITY_TYPE_OPTION = "__custom__";

// Phase 4, task-221 (docs/02-design/pages/master-data.md §10.3). Not built
// on AdminEntityListPage -- Templates' Push/Drift actions don't fit that
// shell's Create/Edit/Deactivate-only shape.
export function MasterDataTemplateListPage() {
  const { data, isLoading, isError, error, refetch } = useMasterDataTemplates();
  const { data: clinicsData } = useQuery({ queryKey: ["master-data", "clinics", "options"], queryFn: () => clinicService.list() });
  const [showCreate, setShowCreate] = useState(false);
  const [entityTypeSelection, setEntityTypeSelection] = useState<string>("");
  const [customEntityType, setCustomEntityType] = useState("");
  const [payloadText, setPayloadText] = useState("{}");
  const [ownerClinicId, setOwnerClinicId] = useState("");
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const createTemplate = useCreateMasterDataTemplate();

  const isCustomEntityType = entityTypeSelection === CUSTOM_ENTITY_TYPE_OPTION;
  const entityType = isCustomEntityType ? customEntityType : entityTypeSelection;

  function submitCreate() {
    let templatePayload: Record<string, unknown>;
    try {
      templatePayload = JSON.parse(payloadText);
    } catch {
      setPayloadError("Template payload must be valid JSON.");
      return;
    }
    setPayloadError(null);
    createTemplate.mutate({ entityType, templatePayload, ownerClinicId });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Master Data Templates</h1>
        <PermissionGuard permission="masterdata.template.manage">
          <Button onClick={() => setShowCreate(true)}>New Template</Button>
        </PermissionGuard>
      </div>

      {isLoading && <LoadingState label="Loading templates..." rows={5} columns={4} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState title="No templates found" description="Create a template to push standardized reference data to branches." />
      )}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Entity Type</TableHeaderCell>
              <TableHeaderCell>Version</TableHeaderCell>
              <TableHeaderCell>Owner Clinic</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((template) => {
              const clinic = clinicsData?.items.find((c) => c.id === template.ownerClinicId);
              return (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.entityType}</TableCell>
                  <TableCell className="font-tabular">{template.version}</TableCell>
                  <TableCell>{clinic?.clinicName ?? template.ownerClinicId}</TableCell>
                  <TableCell>
                    <Link href={`/master-data/templates/${template.id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {showCreate && (
        <Modal title="New Template" onClose={() => setShowCreate(false)}>
          <div className="flex flex-col gap-3">
            <Select
              id="template-entity-type"
              label="Entity Type"
              value={entityTypeSelection}
              onChange={(e) => setEntityTypeSelection(e.target.value)}
            >
              <option value="">Select an entity type...</option>
              {REAL_ENTITY_TEMPLATE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type} (pushes to the real entity)
                </option>
              ))}
              <option value={CUSTOM_ENTITY_TYPE_OPTION}>Custom label (metadata only, not applied to a real entity)</option>
            </Select>
            {isCustomEntityType && (
              <Input
                id="template-entity-type-custom"
                label="Custom Entity Type Label"
                value={customEntityType}
                onChange={(e) => setCustomEntityType(e.target.value)}
                placeholder="e.g. ROOM_TYPE"
              />
            )}
            <Select id="template-owner-clinic" label="Owner Clinic" value={ownerClinicId} onChange={(e) => setOwnerClinicId(e.target.value)}>
              <option value="">Select a clinic...</option>
              {clinicsData?.items.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.clinicName}
                </option>
              ))}
            </Select>
            <Textarea
              id="template-payload"
              label="Template Payload (JSON)"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={6}
              error={payloadError ?? undefined}
            />
            {createTemplate.isError && (
              <p role="alert" className="text-sm text-error">
                {getApiErrorMessage(createTemplate.error)}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                isLoading={createTemplate.isPending}
                disabled={!entityType || !ownerClinicId}
                onClick={submitCreate}
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
