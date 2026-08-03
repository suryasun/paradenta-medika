"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAssignPermissions } from "../hooks/useRoleMutations";
import { usePermissions } from "../hooks/useRoles";
import { Permission, Role } from "../types/system.types";

// docs/02-design/pages/system.md §5 flagged this modal as opening with
// every checkbox unchecked regardless of the role's actual current
// permission grants. That's not fixable in the frontend: `PATCH
// /system/roles/:roleId/permissions` (assignPermissions) is write-only --
// there is no `GET /system/roles/:roleId/permissions` (or any `Role`
// field carrying its current permission ids) anywhere in
// apps/backend/src/modules/system/presentation/routes -- confirmed
// against the real route table, not assumed. Flagged to the user rather
// than silently worked around per this pass's own escalation rule.
// What IS fixable without a contract change: not letting the blank
// checkboxes silently imply "this role has zero permissions today" --
// the Alert below makes the actual (unknown) state honest, and warns
// that saving replaces the whole grant set, not just the boxes touched.
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
        <Alert tone="warning">
          This role&apos;s current permissions aren&apos;t available to show here yet. Every box below starts unchecked — it does not
          mean this role has no permissions today. Saving replaces the role&apos;s entire permission set with only what&apos;s checked.
        </Alert>
        {isLoading && <LoadingState label="Loading permissions..." rows={4} columns={1} />}
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
