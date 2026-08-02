"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { Button } from "@/components/ui/Button";

export function Topbar() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div />
      <div className="flex items-center gap-3.5">
        <div className="text-right text-sm">
          <p className="font-medium text-foreground">{user?.username}</p>
          <p className="text-muted">{role}</p>
        </div>
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {user?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <Button variant="secondary" onClick={() => logout.mutate()} isLoading={logout.isPending}>
          Logout
        </Button>
      </div>
    </header>
  );
}
