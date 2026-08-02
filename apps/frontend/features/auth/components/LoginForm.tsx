"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getApiErrorMessage } from "@/lib/api-client";
import { useLogin } from "../hooks/useLogin";

// docs/04-ai-contract/05-auth-contract.md AUTH-038 (username-or-email
// identifier), AUTH-044 (failed login MUST use a generic message and MUST
// NOT reveal whether the user/password/lock condition caused the failure)
// -- the backend's InvalidCredentialsException message is already generic,
// so the frontend passes it through as-is rather than adding its own.
export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate({ identifier, password });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <Input
        id="identifier"
        label="Username or Email"
        autoComplete="username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {login.isError && (
        <p role="alert" className="text-sm text-error">
          {getApiErrorMessage(login.error)}
        </p>
      )}
      <Button type="submit" isLoading={login.isPending} className="mt-2">
        Sign In
      </Button>
    </form>
  );
}
