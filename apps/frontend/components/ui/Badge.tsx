import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Tone = "neutral" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // Status transitions cross-fade over motion-standard (design-system.md
        // §11.7) rather than swapping instantly, so the eye can follow a
        // change on a busy board (Reservation/Queue/Billing/Visit status).
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-[180ms] ease-out",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
