import { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";

// docs/04-ai-contract/03-project-structure-contract.md STRUCT-004/STRUCT-011
// and docs/02-design/ui-guidelines.md: "Permission Guards must reflect RBAC
// ... while never relying on that hiding as the actual security boundary
// (enforcement is server-side)". This hides/disables UI only; every
// underlying API call is still independently permission-checked by the
// backend's requirePermission middleware.
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const hasPermission = useAuthStore((state) => state.hasPermission(permission));
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
