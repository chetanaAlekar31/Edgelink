"use client";

import { CircleAlert, CircleCheck, ClipboardList, Gauge, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { BarChartPanel } from "@/components/ui/bar-chart";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { TrendChart } from "@/components/ui/trend-chart";
import { useAuditJobs } from "@/lib/audit-store";
import { auditJobFromApi, type ApiAuditRow } from "@/lib/audit-api";
import { auditStatusLabel, type AuditJob, type AuditStatus } from "@/lib/audits";
import {
  clientAudits,
  formatAuditDay,
  formatScore,
  getFixtureHealth,
  healthFromPageSpeed,
  isFixtureAudit,
  type CheckLevel,
  type FixtureCheck,
  type FixtureHealth,
} from "@/lib/client-dashboard";
import { useClientRecords } from "@/lib/client-store";

const statusTone: Record<AuditStatus, BadgeTone> = {
  pending: "warning",
  queued: "info",
  running: "info",
  completed: "success",
  failed: "danger",
};

const levelTone: Record<CheckLevel, BadgeTone> = {
  critical: "danger",
  warning: "warning",
  passed: "success",
};

type ClientDashboardProps = {
  clientId: string;
};

export function ClientDashboard({ clientId }: ClientDashboardProps) {
  const router = useRouter();
  const clients = useClientRecords();
  const sessionAudits = useAuditJobs();
  const [apiAudits, setApiAudits] = useState<AuditJob[] | null>(null);
  const [apiHealth, setApiHealth] = useState<FixtureHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const client = clients.find((item) => item.id === clientId) ?? null;
  const jobs = useMemo(() => {
    const remote = apiAudits ?? [];
    const ids = new Set(remote.map((audit) => audit.id));
    return clientAudits(
      [...remote, ...sessionAudits.filter((audit) => audit.clientId === clientId && !ids.has(audit.id))],
      clientId,
    );
  }, [apiAudits, clientId, sessionAudits]);
  const health = apiHealth ?? (client ? getFixtureHealth(client.websiteUrl) : null);

  useEffect(() => {
    let active = true;
    fetch(`/api/clients/${clientId}/dashboard`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          error?: string;
          audits?: ApiAuditRow[];
          pagespeed?: Parameters<typeof healthFromPageSpeed>[0] | null;
        };
        if (!active) return;
        if (!response.ok || !payload.audits) {
          setLoadError(payload.error ?? "Client audit metrics could not be loaded.");
          setLoading(false);
          return;
        }
        setApiAudits(payload.audits.map((row) => auditJobFromApi(row)));
        setApiHealth(payload.pagespeed ? healthFromPageSpeed(payload.pagespeed) : null);
        setLoadError("");
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Client audit metrics could not be loaded.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);
  const latestJob = jobs[0] ?? null;
  const fixtureJob = jobs.find((job) => isFixtureAudit(job)) ?? null;
  const summaryJob = latestJob;
  const showFixtureChecks = Boolean(health && (apiHealth || (summaryJob && isFixtureAudit(summaryJob))));

  const columns: DataTableColumn<AuditJob>[] = [
    { id: "id", header: "Audit ID", cell: (row) => row.id },
    { id: "website", header: "Website URL", cell: (row) => row.websiteUrl },
    {
      id: "score",
      header: "SEO score",
      cell: (row) => {
        if (row.seoScore === null) return "—";
        const fromApi = apiAudits?.some((audit) => audit.id === row.id) ?? false;
        return isFixtureAudit(row) || fromApi ? formatScore(row.seoScore) : `Demo ${row.seoScore}`;
      },
    },
    {
      id: "status",
      header: "Audit status",
      cell: (row) => <StatusBadge label={auditStatusLabel[row.status]} tone={statusTone[row.status]} />,
    },
    { id: "created", header: "Created date", cell: (row) => formatAuditDay(row.createdAt) },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <Button variant="ghost" asChild>
          <Link href={`/audits/${row.id}`}>View details</Link>
        </Button>
      ),
    },
  ];

  if (!client) {
    return (
      <AppShell title="Client">
        <PageHeader
          title="Client dashboard"
          description="This client is not in the current session."
          breadcrumbs={[
            { label: "Admin", href: "/" },
            { label: "Clients", href: "/clients" },
            { label: "Missing client" },
          ]}
        />
        <EmptyState title="Client not found" description="Choose a client from the clients list." />
        <Button variant="outline" asChild>
          <Link href="/clients">Back to clients</Link>
        </Button>
      </AppShell>
    );
  }

  const completed = jobs.filter((job) => job.status === "completed").length;
  const pending = jobs.filter((job) => job.status === "pending").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const latestScore = health ? health.seo : null;
  const checks = health?.checks ?? [];

  return (
    <AppShell title={client.name}>
      <PageHeader
        title={client.name}
        description={`${client.websiteUrl} · ${client.domain}`}
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: client.name },
        ]}
        actions={
          <div className="cs-field">
            <label className="cs-caption cs-field-label" htmlFor="client-dashboard-select">
              Selected client
            </label>
            <select
              id="client-dashboard-select"
              className="cs-input"
              value={client.id}
              onChange={(event) => router.push(`/clients/${event.target.value}`)}
            >
              {clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? <LoadingState label="Loading client audits" /> : null}
      {loadError ? (
        <div className="cs-card">
          <ErrorState title="Client metrics unavailable" description={loadError} />
        </div>
      ) : null}

      <section className="cs-metric-grid" aria-label="Client SEO summary">
        <StatCard
          label="Latest SEO audit score"
          value={latestScore}
          hint={health ? "PageSpeed SEO score from the assessment fixture." : "No assessment fixture for this website."}
          icon={Gauge}
        />
        <StatCard
          label="Previous SEO audit score"
          hint="The assessment data has no earlier SEO score."
          icon={TrendingUp}
        />
        <StatCard label="SEO score improvement" hint="Improvement needs two assessment scores." icon={TrendingUp} />
        <StatCard label="Total completed audits" value={completed} icon={CircleCheck} />
        <StatCard label="Pending audits" value={pending} icon={ClipboardList} />
        <StatCard label="Failed audits" value={failed} icon={CircleAlert} />
        <StatCard label="Latest audit date" value={latestJob ? formatAuditDay(latestJob.createdAt) : null} icon={ClipboardList} />
      </section>

      <section className="cs-split" aria-label="SEO performance">
        <article className="cs-card cs-panel">
          <h2 className="cs-card-title">SEO score trend</h2>
          <p className="cs-caption">
            {health
              ? "One assessment result is available. No earlier scores were provided, so this is not a historical trend."
              : "Session demo audits are not assessment results, so they are not plotted here."}
          </p>
          <TrendChart
            bare
            label="SEO score trend"
            data={
              health
                ? [
                    {
                      label: fixtureJob ? formatAuditDay(fixtureJob.completedAt ?? fixtureJob.createdAt) : "Fixture",
                      value: health.seo,
                    },
                  ]
                : []
            }
            domain={health ? [0, 1] : undefined}
            emptyTitle="No assessment trend"
            emptyDescription="This client has no PageSpeed fixture, so there is no SEO score series to chart."
          />
        </article>
        <article className="cs-card cs-panel">
          <h2 className="cs-card-title">Category scores</h2>
          <p className="cs-caption">Performance, SEO, and accessibility stay on the fixture’s 0 to 1 scale.</p>
          <BarChartPanel
            label="Category scores"
            data={
              health
                ? [
                    { label: "Performance", value: health.performance },
                    { label: "SEO", value: health.seo },
                    { label: "Accessibility", value: health.accessibility },
                  ]
                : []
            }
            emptyTitle="No category scores"
            emptyDescription="Category scores appear for the assessment fixture website only."
          />
        </article>
      </section>

      <section className="cs-section" aria-label="Website health">
        <article className="cs-card cs-panel">
          <h2 className="cs-card-title">Website health overview</h2>
          {health ? (
            <>
              <p className="cs-caption">PageSpeed {health.strategy} result for {client.domain}.</p>
              <ul className="cs-fact-list">
                <li className="cs-fact">Performance {health.performance}</li>
                <li className="cs-fact">SEO {health.seo}</li>
                <li className="cs-fact">Accessibility {health.accessibility}</li>
                {checks.map((check) => (
                  <li key={check.id} className="cs-fact">
                    {check.label} {check.detail} ({check.score})
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState
              title="No assessment fixture"
              description="Website health uses the PageSpeed fixture. This client’s website is not that fixture."
            />
          )}
        </article>
        <article className="cs-card cs-panel">
          <h2 className="cs-card-title">Core Web Vitals</h2>
          <p className="cs-caption">LCP, CLS, and INP scores from the same fixture. Display values stay beside the chart.</p>
          <BarChartPanel
            label="Core Web Vitals"
            data={
              health
                ? checks
                    .filter((check) =>
                      ["largest-contentful-paint", "cumulative-layout-shift", "interaction-to-next-paint"].includes(check.id),
                    )
                    .map((check) => ({
                      label:
                        check.id === "largest-contentful-paint"
                          ? "LCP"
                          : check.id === "cumulative-layout-shift"
                            ? "CLS"
                            : "INP",
                      value: check.score,
                    }))
                : []
            }
            emptyTitle="No Core Web Vitals"
            emptyDescription="Core Web Vitals appear for the assessment fixture website only."
          />
        </article>
      </section>

      <section className="cs-section" aria-label="Latest audit summary">
        <div className="cs-section-heading">
          <h2 className="cs-card-title">Latest audit summary</h2>
          {summaryJob ? (
            <Button variant="primary" asChild>
              <Link href={`/audits/${summaryJob.id}`}>View Full Audit Report</Link>
            </Button>
          ) : null}
        </div>
        {summaryJob ? (
          <article className="cs-card cs-panel">
            <div className="cs-status-row">
              <StatusBadge label={auditStatusLabel[summaryJob.status]} tone={statusTone[summaryJob.status]} />
              <span className="cs-fact">
                Overall score{" "}
                {showFixtureChecks && health
                  ? formatScore(health.seo)
                  : summaryJob.seoScore === null
                    ? "—"
                    : `Demo ${summaryJob.seoScore}`}
              </span>
            </div>
            {showFixtureChecks && health ? (
              <>
                <p className="cs-caption">
                  Checks are the five PageSpeed fixture audits. A score below 0.5 is critical, below 0.9 is a warning, and 0.9 or above passed.
                </p>
                <CheckGroup title="Key issues identified" checks={checks} />
                <CheckGroup title="Critical issues" checks={checks.filter((check) => check.level === "critical")} />
                <CheckGroup title="Warnings" checks={checks.filter((check) => check.level === "warning")} />
                <CheckGroup title="Passed checks" checks={checks.filter((check) => check.level === "passed")} />
              </>
            ) : (
              <EmptyState
                title="No assessment issue list"
                description="Critical issues, warnings, and passed checks are grouped from the PageSpeed fixture. This audit does not include that fixture."
              />
            )}
          </article>
        ) : (
          <EmptyState title="No audits yet" description="Run an audit for this client to build a summary." />
        )}
      </section>

      <section className="cs-section" aria-label="Recent audits">
        <h2 className="cs-card-title">Recent audits</h2>
        <p className="cs-caption">Demo scores are session placeholders. They are not assessment results.</p>
        <DataTable
          columns={columns}
          rows={jobs}
          getRowId={(row) => row.id}
          emptyTitle="No audits for this client"
          emptyDescription="Audits queued for this client will appear here."
        />
      </section>
    </AppShell>
  );
}

function CheckGroup({ title, checks }: { title: string; checks: FixtureCheck[] }) {
  return (
    <div>
      <h3 className="cs-card-title">
        {title}{" "}
        <StatusBadge
          label={String(checks.length)}
          tone={title === "Critical issues" ? levelTone.critical : title === "Warnings" ? levelTone.warning : title === "Passed checks" ? levelTone.passed : "neutral"}
        />
      </h3>
      {checks.length === 0 ? (
        <p className="cs-caption">None in the fixture.</p>
      ) : (
        <ul className="cs-fact-list">
          {checks.map((check) => (
            <li key={check.id} className="cs-fact">
              {check.label}: {check.detail} (score {check.score})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
