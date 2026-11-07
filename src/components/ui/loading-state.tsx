type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div className="cs-loading" role="status" aria-live="polite" aria-busy="true">
      <p className="cs-body">{label}</p>
      <div className="cs-skeleton-stack" aria-hidden="true">
        <span className="cs-skeleton" />
        <span className="cs-skeleton" />
        <span className="cs-skeleton cs-skeleton-short" />
      </div>
    </div>
  );
}
