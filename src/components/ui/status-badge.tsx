export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "cs-badge-neutral",
  info: "cs-badge-info",
  success: "cs-badge-success",
  warning: "cs-badge-warning",
  danger: "cs-badge-danger",
};

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <span className={`cs-badge ${toneClass[tone]}`}>{label}</span>;
}
