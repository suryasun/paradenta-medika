import { Card } from "@/components/ui/Card";

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
    </Card>
  );
}
