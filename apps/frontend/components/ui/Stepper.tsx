import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export interface StepperStep {
  key: string;
  label: string;
}

// docs/02-design/design-system.md §7's Horizontal Stepper, used for both
// display (Stock Transfer's status progression, warehouse.md §7) and
// multi-stage input (Financial Period close checklist, finance.md §5).
export function Stepper({ steps, currentKey, failedKey }: { steps: StepperStep[]; currentKey: string; failedKey?: string }) {
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isFailed = step.key === failedKey;
        const isDone = !isFailed && index < currentIndex;
        const isCurrent = !isFailed && index === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-[180ms] ease-out",
                  isFailed && "bg-error text-white",
                  isDone && !isFailed && "bg-success text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isDone && !isCurrent && !isFailed && "bg-slate-100 text-muted",
                )}
              >
                {isDone ? <Check size={13} strokeWidth={2} aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted")}>{step.label}</span>
            </div>
            {index < steps.length - 1 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
