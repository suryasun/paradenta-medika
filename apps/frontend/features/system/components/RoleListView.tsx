"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRoles } from "../hooks/useRoles";
import { Role } from "../types/system.types";
import { CreateRoleModal } from "./CreateRoleModal";
import { RolePermissionsModal } from "./RolePermissionsModal";

export function RoleListView() {
  const { data, isLoading, isError, error, refetch } = useRoles();
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground">Roles</h1>
        <PermissionGuard permission="system.role.manage">
          <Button onClick={() => setShowCreate(true)}>New Role</Button>
        </PermissionGuard>
      </div>

      {isLoading && <LoadingState label="Loading roles..." />}
      {isError && <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />}
      {!isLoading && !isError && data && data.items.length === 0 && <EmptyState title="No roles found" />}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.roleCode}</TableCell>
                <TableCell>{role.roleName}</TableCell>
                <TableCell>{role.description ?? "-"}</TableCell>
                <TableCell>
                  <Badge tone={role.isSystem ? "info" : "neutral"}>{role.isSystem ? "System" : "Custom"}</Badge>
                </TableCell>
                <TableCell>
                  <PermissionGuard permission="system.role.permission.manage">
                    <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setEditingRole(role)}>
                      Permissions
                    </button>
                  </PermissionGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}
      {editingRole && <RolePermissionsModal role={editingRole} onClose={() => setEditingRole(null)} />}
    </div>
  );
}
