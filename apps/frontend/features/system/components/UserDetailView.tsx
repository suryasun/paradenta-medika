"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { PermissionGuard } from "@/components/guards/PermissionGuard";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRoles } from "../hooks/useRoles";
import { useUser } from "../hooks/useUser";
import { useActivateUser, useAssignRoles, useDeactivateUser, useRevokeSessions, useUpdateUserEmail } from "../hooks/useUserMutations";

export function UserDetailView({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error, refetch } = useUser(userId);
  const { data: rolesData } = useRoles();
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const updateEmail = useUpdateUserEmail(userId);
  const activateUser = useActivateUser(userId);
  const deactivateUser = useDeactivateUser(userId);
  const assignRoles = useAssignRoles(userId);
  const revokeSessions = useRevokeSessions(userId);

  if (isLoading) return <LoadingState label="Loading user..." />;
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />;
  if (!user) return null;

  const currentEmail = email || user.email;

  function toggleRole(roleId: string) {
    setRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">{user.username}</h1>
          <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>{user.status}</Badge>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permission="system.user.activate">
            {user.status !== "ACTIVE" && (
              <Button isLoading={activateUser.isPending} onClick={() => activateUser.mutate()}>
                Activate
              </Button>
            )}
          </PermissionGuard>
          <PermissionGuard permission="system.user.deactivate">
            {user.status === "ACTIVE" && (
              <Button variant="danger" isLoading={deactivateUser.isPending} onClick={() => deactivateUser.mutate()}>
                Deactivate
              </Button>
            )}
          </PermissionGuard>
          <PermissionGuard permission="system.user.session.revoke">
            <Button variant="secondary" isLoading={revokeSessions.isPending} onClick={() => revokeSessions.mutate(undefined)}>
              Revoke All Sessions
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <PermissionGuard permission="system.user.manage">
        <div className="flex items-end gap-3 rounded-lg border border-border p-4">
          <Input id="userEmail" label="Email" type="email" value={currentEmail} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
          <Button isLoading={updateEmail.isPending} onClick={() => updateEmail.mutate(currentEmail)}>
            Save Email
          </Button>
        </div>
        {updateEmail.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(updateEmail.error)}
          </p>
        )}
      </PermissionGuard>

      <PermissionGuard permission="system.user.role.manage">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <span className="text-sm font-medium text-foreground">Assign Roles</span>
          <div className="flex flex-wrap gap-3">
            {rolesData?.items.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
                {role.roleName}
              </label>
            ))}
          </div>
          {assignRoles.isError && (
            <p role="alert" className="text-sm text-error">
              {getApiErrorMessage(assignRoles.error)}
            </p>
          )}
          <Button
            isLoading={assignRoles.isPending}
            disabled={roleIds.length === 0}
            onClick={() => assignRoles.mutate({ roleIds })}
            className="self-start"
          >
            Save Roles
          </Button>
        </div>
      </PermissionGuard>
    </div>
  );
}
