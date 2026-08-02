"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAssignPermissions } from "../hooks/useRoleMutations";
import { usePermissions } from "../hooks/useRoles";
import { Permission, Role } from "../types/system.types";

export function RolePermissionsModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const { data: permissionsData, isLoading } = usePermissions();
  const [selected, setSelected] = useState<string[]>([]);
  const assignPermissions = useAssignPermissions(role.id);

  function toggle(permissionId: string) {
    setSelected((prev) => (prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]));
  }

  const grouped = (permissionsData?.items ?? []).reduce<Record<string, Permission[]>>((acc, permission) => {
    (acc[permission.module] ??= []).push(permission);
    return acc;
  }, {});

  return (
    <Modal title={`Permissions — ${role.roleName}`} onClose={onClose}>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
        {isLoading && <LoadingState label="Loading permissions..." />}
        {!isLoading &&
          Object.entries(grouped).map(([module, permissions]) => (
            <div key={module}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{module}</div>
              <div className="flex flex-col gap-1">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={selected.includes(permission.id)} onChange={() => toggle(permission.id)} />
                    {permission.permissionName}
                    <span className="text-xs text-muted">({permission.permissionKey})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

        {assignPermissions.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(assignPermissions.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={assignPermissions.isPending}
            onClick={() => assignPermissions.mutate(selected, { onSuccess: onClose })}
          >
            Save Permissions
          </Button>
        </div>
      </div>
    </Modal>
  );
}
