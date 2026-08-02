"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useHasHydrated } from "@/stores/useHasHydrated";
import { LoadingState } from "@/components/ui/LoadingState";

// zustand/persist rehydrates from localStorage after mount, so the store is
// briefly empty on first client render even for an already-logged-in user.
// Wait for that rehydration before deciding to redirect, otherwise a page
// refresh on any protected route would incorrectly bounce to /login.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useHasHydrated();

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return <LoadingState label="Checking session..." />;
  }

  return <>{children}</>;
}
