"use client";

import { CircleAlert, CircleCheck, ClipboardList, Clock, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BarChartPanel } from "@/components/ui/bar-chart";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilters, defaultAuditFilters, type AuditFilterValues } from "@/components/ui/search-filters";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import {
  getAdminDashboard,
  type AdminDashboardData,
  type AuditRecord,
  type AuditStatus,
  type ClientQuery,
} from "@/lib/admin-dashboard";

export type DashboardPhase = "ready" | "loading" | "empty" | "error";

const statusTone: Record<AuditStatus, BadgeTone> = {
  completed: "success",
  failed: "danger",
  pending: "warning",
};

const statusLabel: Record<AuditStatus, string> = {
  completed: "Completed",
  failed: "Failed",
  pending: "Pending",
};

const auditColumns: DataTableColumn<AuditRecord>[] = [
  { id: "website", header: "Website", cell: (row) => row.website },
  { id: "strategy", header: "Strategy", cell: (row) => row.strategy },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge label={statusLabel[row.status]} tone={statusTone[row.status]} />,
  },
  { id: "seo", header: "SEO", cell: (row) => String(row.seo) },
  { id: "performance", header: "Performance", cell: (row) => String(row.performance) },
  { id: "accessibility", header: "Accessibility", cell: (row) => String(row.accessibility) },
  { id: "lcp", header: "LCP", cell: (row) => row.lcp },
  { id: "cls", header: "CLS", cell: (row) => row.cls },
  { id: "inp", header: "INP", cell: (row) => row.inp },
  { id: "blocking", header: "Blocking resources", cell: (row) => row.blocking },
  { id: "unused", header: "Unused JavaScript", cell: (row) => row.unusedJavaScript },
];

const queryColumns: DataTableColumn<ClientQuery>[] = [
  { id: "query", header: "Query", cell: (row) => row.query },
  { id: "clicks", header: "Clicks", cell: (row) => String(row.clicks) },
  { id: "impressions", header: "Impressions", cell: (row) => String(row.impressions) },
  { id: "ctr", header: "CTR", cell: (row) => String(row.ctr) },
  { id: "position", header: "Position", cell: (row) => String(row.position) },
];

const emptyDashboard: AdminDashboardData = {
  clientCount: 0,
  clientDomain: "",
  totalAudits: 0,
  completedAudits: 0,
  failedAudits: 0,
  pendingAudits: 0,
  scoreOverview: [],
  activity: [],
  audits: [],
  totalClicks: 0,
  totalImpressions: 0,
  indexCoverageErrors: 0,
  keyword: "",
  clientRankPosition: 0,
  keywordSearchVolume: 0,
  queries: [],
};

type DashboardHomeProps = {
  phase?: DashboardPhase;
};

export function DashboardHome({ phase = "ready" }: DashboardHomeProps) {
  const [filters, setFilters] = useState<AuditFilterValues>(defaultAuditFilters);
  const [applied, setApplied] = useState<AuditFilterValues>(defaultAuditFilters);
  const data = phase === "empty" ? emptyDashboard : getAdminDashboard();
  const isLoading = phase === "loading";

  const audits = useMemo(() => {
    return data.audits.filter((audit) => {
      const matchesQuery = audit.website.toLowerCase().includes(applied.query.toLowerCase());
      const matchesStatus = applied.status === "all" || audit.status === applied.status;
      return matchesQuery && matchesStatus;
    });
  }, [applied, data.audits]);

  const queries = useMemo(() => {
    return data.queries.filter((row) => row.query.toLowerCase().includes(applied.query.toLowerCase()));
  }, [applied.query, data.queries]);

  const auditEmptyDescription = applied.query || applied.status !== "all"
    ? "No audits match this filter."
    : "No SEO audits are in the assessment fixture.";

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title="Dashboard"
        description="Admin view of client audits, scores, and search activity from the assessment fixtures."
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Dashboard" },
        ]}
      />

      {phase === "error" ? (
        <div className="cs-card">
          <ErrorState
            title="Dashboard unavailable"
            description="Audit metrics could not be loaded. The assessment fixtures are the only data source in this step."
          />
        </div>
      ) : (
        <>
          <section className="cs-metric-grid" aria-label="Audit totals" aria-busy={isLoading}>
            {isLoading ? (
              <>
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
                <MetricSkeleton />
              </>
            ) : (
              <>
                <StatCard label="Total clients" value={data.clientCount} hint={data.clientDomain || undefined} icon={Users} />
                <StatCard label="Total SEO audits" value={data.totalAudits} icon={ClipboardList} />
                <StatCard label="Completed audits" value={data.completedAudits} icon={CircleCheck} />
                <StatCard label="Failed audits" value={data.failedAudits} icon={CircleAlert} />
                <StatCard label="Pending audits" value={data.pendingAudits} icon={Clock} />
              </>
            )}
          </section>

          <section className="cs-split" aria-label="Charts">
            <article className="cs-card cs-panel">
              <h2 className="cs-card-title">SEO score overview</h2>
              <p className="cs-caption">PageSpeed category scores for the fixture URL. Values stay on the 0 to 1 scale.</p>
              <BarChartPanel
                data={data.scoreOverview}
                label="SEO score overview"
                isLoading={isLoading}
                emptyTitle="No scores yet"
                emptyDescription="Category scores appear when a PageSpeed fixture is available."
              />
            </article>
            <article className="cs-card cs-panel">
              <h2 className="cs-card-title">Audit activity</h2>
              <p className="cs-caption">Completed, failed, and pending audits in the current fixture.</p>
              <BarChartPanel
                data={data.activity}
                label="Audit activity"
                isLoading={isLoading}
                emptyTitle="No audit activity"
                emptyDescription="Activity appears after an audit fixture is loaded."
                allowDecimals={false}
              />
            </article>
          </section>

          <section className="cs-section" aria-label="Recent audits">
            <div className="cs-section-heading">
              <h2 className="cs-card-title">Recent audits</h2>
              {isLoading ? null : (
                <div className="cs-status-row">
                  <StatusBadge label={`${data.completedAudits} completed`} tone="success" />
                  <StatusBadge label={`${data.failedAudits} failed`} tone="danger" />
                  <StatusBadge label={`${data.pendingAudits} pending`} tone="warning" />
                </div>
              )}
            </div>
            <SearchFilters
              values={filters}
              onApply={(next) => {
                setFilters(next);
                setApplied(next);
              }}
            />
            <DataTable
              columns={auditColumns}
              rows={audits}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              emptyTitle="No audits yet"
              emptyDescription={auditEmptyDescription}
            />
          </section>

          <section className="cs-section" aria-label="Recent client activity">
            <div className="cs-section-heading">
              <h2 className="cs-card-title">Recent client activity</h2>
              {!isLoading && data.clientDomain ? <p className="cs-caption">{data.clientDomain}</p> : null}
            </div>
            {isLoading ? null : data.queries.length > 0 ? (
              <ul className="cs-fact-list">
                <li className="cs-fact">Clicks {data.totalClicks}</li>
                <li className="cs-fact">Impressions {data.totalImpressions}</li>
                <li className="cs-fact">Index coverage errors {data.indexCoverageErrors}</li>
                <li className="cs-fact">Keyword {data.keyword}</li>
                <li className="cs-fact">Rank {data.clientRankPosition}</li>
                <li className="cs-fact">Search volume {data.keywordSearchVolume}</li>
              </ul>
            ) : null}
            <DataTable
              columns={queryColumns}
              rows={queries}
              getRowId={(row) => row.query}
              isLoading={isLoading}
              emptyTitle="No client activity"
              emptyDescription={
                applied.query
                  ? "No search queries match this filter."
                  : "Search Console rows appear when the fixture includes them."
              }
            />
          </section>
        </>
      )}
    </AppShell>
  );
}

function MetricSkeleton() {
  return (
    <article className="cs-card cs-stat-card" aria-hidden="true">
      <span className="cs-skeleton cs-skeleton-short" />
      <span className="cs-skeleton" />
    </article>
  );
}
