"use client";

import { ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { InlineEditableCell } from "@/components/ui/InlineEditableCell";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { AdminEntityForm } from "./AdminEntityForm";
import { EntityFormValues, FieldConfig } from "../lib/fieldConfig";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface AdminEntityListPageProps<T extends { id: string; isActive?: boolean }> {
  title: string;
  resourceKey: string;
  permissionPrefix: string;
  columns: Column<T>[];
  fields: FieldConfig[];
  service: {
    list: (params?: Record<string, unknown>) => Promise<{ items: T[] }>;
    create: (payload: Record<string, unknown>) => Promise<T>;
    update: (id: string, payload: Record<string, unknown>) => Promise<T>;
  };
  /** Phase 4 (docs/02-design/pages/master-data.md §10.1): extra per-row links/buttons rendered alongside Edit/Deactivate, e.g. Branch's "Configuration" link. Optional -- every pre-existing consumer is unaffected. */
  extraRowActions?: (item: T) => ReactNode;
}

// Shared list/create/edit shell for all Master Data admin entities.
// Each entity page supplies its columns/fields/service; this component owns
// the query, the create modal, the edit modal, the isActive toggle, search,
// and inline edit for single-field corrections (docs/02-design/pages/
// master-data.md §9): any non-createOnly text/number field that also has a
// list column gets an inline edit affordance instead of requiring the full
// modal for a one-field change. Multi-field edits and createOnly fields
// (Code) stay in the modal.
export function AdminEntityListPage<T extends { id: string; isActive?: boolean }>({
  title,
  resourceKey,
  permissionPrefix,
  columns,
  fields,
  service,
  extraRowActions,
}: AdminEntityListPageProps<T>) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["master-data", resourceKey, "list"],
    queryFn: () => service.list(),
  });

  const createMutation = useMutation({
    mutationFn: (values: EntityFormValues) => service.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", resourceKey] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EntityFormValues }) => service.update(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", resourceKey] });
      setEditingItem(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => service.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["master-data", resourceKey] }),
  });

  const inlineEditableFieldByKey = useMemo(() => {
    const map = new Map<string, FieldConfig>();
    for (const field of fields) {
      if (!field.createOnly && (field.type === "text" || field.type === "number")) {
        map.set(field.name, field);
      }
    }
    return map;
  }, [fields]);

  async function commitInlineEdit(item: T, field: FieldConfig, nextValue: string | number) {
    await service.update(item.id, { [field.name]: nextValue });
    await queryClient.invalidateQueries({ queryKey: ["master-data", resourceKey] });
  }

  const items = data?.items ?? [];
  const filteredItems = search.trim()
    ? items.filter((item) =>
        columns.some((col) => String((item as Record<string, unknown>)[col.key] ?? "").toLowerCase().includes(search.trim().toLowerCase())),
      )
    : items;

  const createAction = (
    <PermissionGuard permission={`${permissionPrefix}.manage`}>
      <Button onClick={() => setShowCreate(true)}>New {title.replace(/s$/, "")}</Button>
    </PermissionGuard>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">{title}</h1>
        {createAction}
      </div>

      {items.length > 0 && (
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      )}

      {isLoading && <LoadingState label={`Loading ${title.toLowerCase()}...`} rows={5} columns={columns.length + 2} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && items.length === 0 && (
        <EmptyState title={`No ${title.toLowerCase()} found`} description={`Get started by adding the first ${title.toLowerCase().replace(/s$/, "")}.`} action={createAction} />
      )}
      {!isLoading && !isError && data && items.length > 0 && filteredItems.length === 0 && (
        <EmptyState title="No matches" description="Try a different search term." />
      )}
      {!isLoading && !isError && filteredItems.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableHeaderCell key={col.key}>{col.label}</TableHeaderCell>
              ))}
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => {
                  const field = inlineEditableFieldByKey.get(col.key);
                  const rawValue = (item as Record<string, unknown>)[col.key];
                  if (field && (typeof rawValue === "string" || typeof rawValue === "number")) {
                    return (
                      <TableCell key={col.key}>
                        <InlineEditableCell
                          value={rawValue}
                          type={field.type === "number" ? "number" : "text"}
                          displayValue={col.render ? col.render(item) : undefined}
                          aria-label={`${field.label} for ${(item as Record<string, unknown>)[columns[0]?.key] ?? item.id}`}
                          onCommit={(nextValue) => commitInlineEdit(item, field, nextValue)}
                        />
                      </TableCell>
                    );
                  }
                  return <TableCell key={col.key}>{col.render ? col.render(item) : String(rawValue ?? "-")}</TableCell>;
                })}
                <TableCell>
                  <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-3">
                      <PermissionGuard permission={`${permissionPrefix}.manage`}>
                        <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setEditingItem(item)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-muted hover:underline"
                          onClick={() => toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive })}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </PermissionGuard>
                      {extraRowActions?.(item)}
                    </div>
                    {toggleActiveMutation.isError && toggleActiveMutation.variables?.id === item.id && (
                      <p role="alert" className="text-xs text-error">
                        {getApiErrorMessage(toggleActiveMutation.error)}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && (
        <Modal title={`New ${title.replace(/s$/, "")}`} onClose={() => setShowCreate(false)}>
          <AdminEntityForm
            fields={fields}
            mode="create"
            isSubmitting={createMutation.isPending}
            submitError={createMutation.isError ? createMutation.error : undefined}
            submitLabel="Create"
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </Modal>
      )}

      {editingItem && (
        <Modal title={`Edit ${title.replace(/s$/, "")}`} onClose={() => setEditingItem(null)}>
          <AdminEntityForm
            fields={fields}
            mode="edit"
            initialValues={editingItem as unknown as EntityFormValues}
            isSubmitting={updateMutation.isPending}
            submitError={updateMutation.isError ? updateMutation.error : undefined}
            submitLabel="Save Changes"
            onSubmit={(values) => updateMutation.mutate({ id: editingItem.id, values })}
          />
        </Modal>
      )}
    </div>
  );
}
