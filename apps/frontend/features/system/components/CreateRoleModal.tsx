"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getApiErrorMessage } from "@/lib/api-client";
import { useCreateRole } from "../hooks/useRoleMutations";

export function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const [roleCode, setRoleCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const createRole = useCreateRole();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createRole.mutate({ roleCode, roleName, description: description || undefined }, { onSuccess: onClose });
  }

  return (
    <Modal title="New Role" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="roleCode" label="Role Code" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} required />
        <Input id="roleName" label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
        <Input id="roleDescription" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {createRole.isError && (
          <p role="alert" className="text-sm text-error">
            {getApiErrorMessage(createRole.error)}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createRole.isPending}>
            Create Role
          </Button>
        </div>
      </form>
    </Modal>
  );
}
