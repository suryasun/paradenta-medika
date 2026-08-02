"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-client";
import { useRoles } from "../hooks/useRoles";
import { useCreateUser } from "../hooks/useUserMutations";

export function CreateUserForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const { data: rolesData } = useRoles();
  const createUser = useCreateUser();

  function toggleRole(roleId: string) {
    setRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createUser.mutate({ username, email, password, roleIds: roleIds.length > 0 ? roleIds : undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <Input id="username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

      <div>
        <span className="text-sm font-medium text-foreground">Roles</span>
        <div className="mt-1 flex flex-wrap gap-3">
          {rolesData?.items.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
              {role.roleName}
            </label>
          ))}
        </div>
      </div>

      {createUser.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(createUser.error)}
        </p>
      )}

      <Button type="submit" isLoading={createUser.isPending} className="self-start">
        Create User
      </Button>
    </form>
  );
}
