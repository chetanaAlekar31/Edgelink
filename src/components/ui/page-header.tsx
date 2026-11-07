import Link from "next/link";
import type { ReactNode } from "react";

export type Crumb = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  actions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <header className="cs-page-header">
      <nav aria-label="Breadcrumb">
        <ol className="cs-breadcrumbs">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li key={`${crumb.label}-${index}`} className="cs-caption">
                {index > 0 ? <span aria-hidden="true"> / </span> : null}
                {crumb.href && !isLast ? (
                  <Link className="cs-crumb-link" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="cs-crumb-current" aria-current={isLast ? "page" : undefined}>
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="cs-page-header-row">
        <div className="cs-page-copy">
          <h1 className="cs-h3">{title}</h1>
          {description ? <p className="cs-body">{description}</p> : null}
        </div>
        {actions ? <div className="cs-filter-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
