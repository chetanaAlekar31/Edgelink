import { CircleAlert } from "lucide-react";

type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="cs-error" role="alert">
      <span className="cs-error-icon" aria-hidden="true">
        <CircleAlert size={22} />
      </span>
      <h2 className="cs-h3">{title}</h2>
      <p className="cs-body">{description}</p>
    </div>
  );
}
