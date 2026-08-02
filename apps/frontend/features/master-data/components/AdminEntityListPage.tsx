"use client";

import { ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
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
}

// Shared list/create/edit shell for all six Master Data admin entities
// (task-021..026). Each entity page supplies its columns/fields/service;
// this component owns the query, the create modal, the edit modal, and
// the isActive toggle (every entity supports deactivate via update).
export function AdminEntityListPage<T extends { id: string; isActive?: boolean }>({
  title,
  resourceKey,
  permissionPrefix,
  columns,
  fields,
  service,
}: AdminEntityListPageProps<T>) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <PermissionGuard permission={`${permissionPrefix}.manage`}>
          <Button onClick={() => setShowCreate(true)}>New {title.replace(/s$/, "")}</Button>
        </PermissionGuard>
      </div>

      {isLoading && <LoadingState label={`Loading ${title.toLowerCase()}...`} />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && <EmptyState title={`No ${title.toLowerCase()} found`} />}
      {!isLoading && !isError && data && data.items.length > 0 && (
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
            {data.items.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "-")}</TableCell>
                ))}
                <TableCell>
                  <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
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
