import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface BadgeProps {
  status: "approved" | "not_confirmed" | "under_review";
}

export default function Badge({ status }: BadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: `${color}15` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
