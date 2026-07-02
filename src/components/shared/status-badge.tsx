import { Badge } from "@/components/ui/badge";
import type { EnumStyle } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  className?: string;
}

export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}

interface EnumBadgeProps<K extends string> {
  map: Record<K, EnumStyle>;
  value: K;
}

/** Badge coloré pour un enum métier (statuts, gravités…) à partir des maps de labels.ts. */
export function EnumBadge<K extends string>({ map, value }: EnumBadgeProps<K>) {
  const style = map[value] as EnumStyle | undefined;
  if (!style) return <StatusBadge label={value} />;
  return <StatusBadge label={style.label} className={style.className} />;
}
