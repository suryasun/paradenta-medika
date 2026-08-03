import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";

// docs/02-design/design-system.md §11.7 (Epic I "Dashboard Simple" --
// deliberately no chart library here, that would over-build past
// "Simple"): tabular figures, a small category icon, and a count-up on
// value change instead of an instant digit swap.
interface MetricCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon?: LucideIcon;
}

export function MetricCard({ label, value, format, icon: Icon }: MetricCardProps) {
  const displayValue = useCountUp(value);
  const displayNumber = typeof displayValue === "number" ? displayValue : value;

  return (
    <Card className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm text-muted">
        {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />}
        {label}
      </span>
      <span className="font-tabular text-2xl font-semibold text-foreground">{format ? format(displayNumber) : displayNumber}</span>
    </Card>
  );
}
