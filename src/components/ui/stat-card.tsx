import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value?: string | number | null;
  hint?: string;
  icon?: LucideIcon;
};

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <article className="cs-card cs-stat-card">
      {Icon ? (
        <span className="cs-stat-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
      ) : null}
      <p className="cs-caption">{label}</p>
      {hasValue ? <p className="cs-h3">{value}</p> : <p className="cs-body">No data yet</p>}
      {hint ? <p className="cs-caption">{hint}</p> : null}
    </article>
  );
}
