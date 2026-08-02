import { useSyncExternalStore } from "react";
import { useAuthStore } from "./auth.store";

// zustand/persist rehydrates asynchronously after mount. Expose hydration
// status via useSyncExternalStore (not an effect + setState) to avoid the
// "cascading renders" anti-pattern flagged by eslint-plugin-react-hooks.
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}
