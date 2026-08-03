import { ReactNode } from "react";
import { cn } from "@/utils/cn";

// docs/02-design/design-system.md §7: "Alert -- Inline success/warning/error
// banners (form validation summary, stock alerts)." Not built until now --
// first call site is RolePermissionsModal/UserDetailView's honest-gap
// notice (see those files for why).
type Tone = "warning" | "error" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  warning: "border-warning/30 bg-warning-bg text-warning",
  error: "border-error/30 bg-error-bg text-error",
  info: "border-info/30 bg-info-bg text-info",
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div role="status" className={cn("rounded-md border px-3 py-2 text-xs leading-relaxed", TONE_CLASSES[tone])}>
      {children}
    </div>
  );
}
