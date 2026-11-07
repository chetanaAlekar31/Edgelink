import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="cs-empty" role="status">
      <span className="cs-empty-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <h2 className="cs-h3">{title}</h2>
      <p className="cs-body">{description}</p>
    </div>
  );
}
