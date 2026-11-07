"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuditAssessment, type RankingRow, type SearchQueryRow } from "@/lib/audit-assessment";
import { auditJobFromApi, type ApiAuditRow } from "@/lib/audit-api";
import { useAuditJobs } from "@/lib/audit-store";
import { mocksEnabled } from "@/lib/fixtures";
import { issueText, seoAnalysisSchema, type SeoAnalysis } from "@/lib/seo-analysis";
import { auditStatusLabel, type AuditJob, type AuditStatus } from "@/lib/audits";
import { formatAuditDay, type CheckLevel, type FixtureCheck } from "@/lib/client-dashboard";
import { useClientRecords } from "@/lib/client-store";
import { useReportJobs } from "@/lib/report-store";

const notAvailable = "Not available";

const statusTone: Record<AuditStatus, BadgeTone> = {
  pending: "warning",
  queued: "info",
  running: "info",
  completed: "success",
  failed: "danger",
};

const checkTone: Record<CheckLevel, BadgeTone> = {
  critical: "danger",
  warning: "warning",
  passed: "success",
};

const checkLabel: Record<CheckLevel, string> = {
  critical: "Failed",
  warning: "Warning",
  passed: "Passed",
};

const queryColumns: DataTableColumn<SearchQueryRow>[] = [
  { id: "query", header: "Search query", cell: (row) => row.query },
  { id: "clicks", header: "Clicks", cell: (row) => String(row.clicks) },
  { id: "impressions", header: "Impressions", cell: (row) => String(row.impressions) },
  { id: "ctr", header: "CTR", cell: (row) => String(row.ctr) },
  { id: "position", header: "Average position", cell: (row) => String(row.position) },
];

const rankingColumns: DataTableColumn<RankingRow>[] = [
  { id: "domain", header: "Domain", cell: (row) => row.domain },
  { id: "group", header: "Rank group", cell: (row) => String(row.rankGroup) },
  { id: "absolute", header: "Absolute rank", cell: (row) => String(row.rankAbsolute) },
];

const onPageFields = ["Title tag", "Meta description", "Heading structure", "Image alt attributes", "Internal links", "Broken links"];
const technicalFields = ["Robots.txt validation", "Sitemap validation", "Schema validation", "Crawlability"];

type AuditDetailPageProps = {
  auditId: string;
};

export function AuditDetailPage({ auditId }: AuditDetailPageProps) {
  const sessionAudits = useAuditJobs();
  const clients = useClientRecords();
  const reports = useReportJobs();
  const [remote, setRemote] = useState<AuditJob | null>(null);
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch(`/api/audits/${auditId}`)
      .then(async (response) => {
        if (!active) return;
        if (response.status === 404) {
          setPhase("ready");
          return;
        }
        if (!response.ok) {
          setPhase("error");
          return;
        }
        const payload = (await response.json()) as {
          audit: ApiAuditRow & {
            report?: { downloadPath?: string | null } | null;
            result?: { analysis?: unknown } | null;
          };
        };
        const parsed = seoAnalysisSchema.safeParse(payload.audit.result?.analysis);
        setAnalysis(parsed.success ? parsed.data : null);
        setPdfPath(payload.audit.report?.downloadPath ?? null);
        setRemote(
          auditJobFromApi({
            ...payload.audit,
            reportAvailable: Boolean(payload.audit.report?.downloadPath),
          }),
        );
        setPhase("ready");
      })
      .catch(() => {
        if (active) setPhase("error");
      });
    return () => {
      active = false;
    };
  }, [auditId]);

  const audit = remote ?? sessionAudits.find((item) => item.id === auditId) ?? null;

  if (!audit && phase === "loading") {
    return (
      <AppShell title="Audit">
        <LoadingState label="Loading audit" />
      </AppShell>
    );
  }

  if (!audit && phase === "error") {
    return (
      <AppShell title="Audit">
        <ErrorState title="Audit unavailable" description="This audit could not be loaded." />
      </AppShell>
    );
  }

  if (!audit) {
    return (
      <AppShell title="Audit">
        <PageHeader
          title="Audit details"
          description="This audit is not in the current session."
          breadcrumbs={[
            { label: "Admin", href: "/" },
            { label: "Audits", href: "/audits" },
            { label: "Missing audit" },
          ]}
          actions={
            <Button variant="outline" asChild>
              <Link href="/audits">Back to Audits</Link>
            </Button>
          }
        />
        <EmptyState title="Audit not found" description="Open an audit from the audits list or a client dashboard." />
      </AppShell>
    );
  }

  const client = clients.find((item) => item.id === audit.clientId);
  const clientName = client?.name ?? audit.clientName;
  const linkedReport = reports.find((item) => item.auditId === audit.id);
  const assessment = getAuditAssessment(audit);
  const auditDate = audit.completedAt ?? audit.createdAt;
  const seoScore = assessment ? String(assessment.health.seo) : notAvailable;
  const performanceScore = assessment ? String(assessment.health.performance) : notAvailable;
  const accessibilityScore = assessment ? String(assessment.health.accessibility) : notAvailable;

  return (
    <AppShell title="Audit">
      <PageHeader
        title={audit.id}
        description={`${clientName} · ${audit.websiteUrl}`}
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Audits", href: "/audits" },
          { label: audit.id },
        ]}
        actions={
          <div className="cs-filter-actions">
            <Button variant="outline" asChild>
              <Link href="/audits">Back to Audits</Link>
            </Button>
            {client ? (
              <Button variant="outline" asChild>
                <Link href={`/clients/${client.id}`}>Client dashboard</Link>
              </Button>
            ) : null}
            {linkedReport ? (
              <Button variant="outline" asChild>
                <Link href={`/reports/${linkedReport.id}`}>View report</Link>
              </Button>
            ) : null}
            {pdfPath ? (
              <Button variant="primary" asChild>
                <a href={pdfPath}>Download PDF</a>
              </Button>
            ) : null}
            {audit.reportAvailable && audit.report ? (
              <Button variant="primary" onClick={() => downloadReport(audit)}>
                Download Report
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="cs-card cs-panel" aria-label="Audit summary">
        <div className="cs-status-row">
          <StatusBadge label={auditStatusLabel[audit.status]} tone={statusTone[audit.status]} />
        </div>
        <dl className="cs-details">
          <Detail label="Audit ID" value={audit.id} />
          <Detail label="Client name" value={clientName} />
          <Detail label="Website URL" value={audit.websiteUrl} />
          <Detail label="Audit date" value={formatAuditDay(auditDate)} />
          <Detail label="Audit status" value={auditStatusLabel[audit.status]} />
        </dl>
      </section>

      <section className="cs-stat-grid" aria-label="Score summary">
        <StatCard label="Overall SEO score" value={seoScore} hint={assessment ? "PageSpeed SEO category score from the assessment fixture." : "No assessment score for this audit."} />
        <StatCard label="Performance score" value={performanceScore} />
        <StatCard label="SEO score" value={seoScore} />
        <StatCard label="Accessibility score" value={accessibilityScore} />
      </section>

      <section className="cs-section" aria-label="Claude analysis">
        <h2 className="cs-card-title">Claude analysis</h2>
        {analysis ? (
          <>
            {mocksEnabled() ? (
              <p className="cs-caption">
                Mock mode did not call Claude. Issue lines repeat the assessment fixture. The executive summary and recommendations were not provided.
              </p>
            ) : null}
            <div className="cs-stat-grid">
              <StatCard label="Overall score" value={analysis.overall_score ?? notAvailable} hint="0 to 100. Converted from the PageSpeed SEO score when Claude is mocked." />
              <StatCard label="Core Web Vitals" value={analysis.score_breakdown.core_web_vitals ?? notAvailable} />
              <StatCard label="Technical" value={analysis.score_breakdown.technical ?? notAvailable} />
              <StatCard label="On-page" value={analysis.score_breakdown.on_page ?? notAvailable} />
            </div>
            <h3 className="cs-card-title">Critical issues</h3>
            {analysis.critical_issues.length ? (
              <ul className="cs-fact-list">
                {analysis.critical_issues.map((issue) => (
                  <li key={issueText(issue)} className="cs-fact">{issueText(issue)}</li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Not available" description="No critical issues were returned." />
            )}
            <h3 className="cs-card-title">Warnings</h3>
            {analysis.important_issues.length ? (
              <ul className="cs-fact-list">
                {analysis.important_issues.map((issue) => (
                  <li key={issueText(issue)} className="cs-fact">{issueText(issue)}</li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Not available" description="No warnings were returned." />
            )}
            <h3 className="cs-card-title">Recommendations</h3>
            {analysis.recommendations.length ? (
              <ul className="cs-fact-list">
                {analysis.recommendations.map((item) => (
                  <li key={`${item.priority}-${item.finding}`} className="cs-fact">
                    {item.priority} · {item.category}: {item.finding} Fix: {item.fix}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Not available" description="The assessment does not include recommendation text." />
            )}
            <h3 className="cs-card-title">Suggested next steps</h3>
            {analysis.quick_wins.length ? (
              <ul className="cs-fact-list">
                {analysis.quick_wins.map((issue) => (
                  <li key={issueText(issue)} className="cs-fact">{issueText(issue)}</li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Not available" description="No quick wins were returned." />
            )}
          </>
        ) : (
          <EmptyState title="Not available" description="This audit does not have a saved Claude analysis." />
        )}
      </section>

      <Tabs defaultValue="pagespeed">
        <TabsList aria-label="SEO analysis">
          <TabsTrigger value="pagespeed">PageSpeed Insights</TabsTrigger>
          <TabsTrigger value="gsc">Google Search Console</TabsTrigger>
          <TabsTrigger value="on-page">On-page SEO</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
          <TabsTrigger value="rankings">DataForSEO</TabsTrigger>
        </TabsList>

        <TabsContent value="pagespeed">
          {assessment ? (
            <>
              <p className="cs-caption">Strategy {assessment.health.strategy}. Scores stay on the 0 to 1 scale.</p>
              <div className="cs-stat-grid">
                <StatCard label="Performance score" value={assessment.health.performance} />
                <StatCard label="SEO score" value={assessment.health.seo} />
                <StatCard label="Accessibility score" value={assessment.health.accessibility} />
              </div>
              <ul className="cs-fact-list">
                {assessment.health.checks.map((check) => (
                  <li key={check.id} className="cs-fact">
                    {check.label}: {check.detail} (score {check.score}){" "}
                    <StatusBadge label={checkLabel[check.level]} tone={checkTone[check.level]} />
                  </li>
                ))}
              </ul>
              <Collapsible title="Detailed checks">
                <p className="cs-caption">
                  A score below 0.5 is failed, below 0.9 is a warning, and 0.9 or above passed. These are the five PageSpeed fixture audits.
                </p>
                <CheckList checks={assessment.health.checks} />
              </Collapsible>
            </>
          ) : (
            <EmptyState
              title="Not available"
              description="This audit does not include the PageSpeed fixture for example-dental-clinic.com."
            />
          )}
        </TabsContent>

        <TabsContent value="gsc">
          {assessment ? (
            <>
              <div className="cs-stat-grid">
                <StatCard label="Clicks" value={assessment.totalClicks} />
                <StatCard label="Impressions" value={assessment.totalImpressions} />
                <StatCard label="Index coverage errors" value={assessment.indexCoverageErrors} />
                <StatCard label="Average position" value={notAvailable} hint="The fixture stores position on each query, not one site-wide average." />
              </div>
              <DataTable
                columns={queryColumns}
                rows={assessment.queries}
                getRowId={(row) => row.query}
                emptyTitle="Not available"
                emptyDescription="The Search Console fixture has no queries."
              />
            </>
          ) : (
            <EmptyState title="Not available" description="Search Console results in the assessment fixture belong to the example dental clinic audit." />
          )}
        </TabsContent>

        <TabsContent value="on-page">
          <UnavailableFields
            fields={onPageFields}
            issuesTitle="On-page issues and recommendations"
            description="The assessment fixture does not include title, meta, heading, image, or link results."
          />
        </TabsContent>

        <TabsContent value="technical">
          <UnavailableFields
            fields={technicalFields}
            issuesTitle="Technical issues and warnings"
            description="The assessment fixture names the robots.txt, sitemap, and schema steps, and it does not include their results."
          />
        </TabsContent>

        <TabsContent value="rankings">
          {assessment ? (
            <>
              <div className="cs-stat-grid">
                <StatCard label="Target keyword" value={assessment.keyword} />
                <StatCard label="Client domain ranking" value={assessment.clientRankPosition} />
                <StatCard label="Search volume" value={assessment.keywordSearchVolume} />
              </div>
              <DataTable
                columns={rankingColumns}
                rows={assessment.rankings}
                getRowId={(row) => row.domain}
                emptyTitle="Not available"
                emptyDescription="The DataForSEO fixture has no ranking rows."
              />
            </>
          ) : (
            <EmptyState title="Not available" description="DataForSEO rankings in the assessment fixture belong to the example dental clinic audit." />
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="cs-caption">{label}</dt>
      <dd className="cs-body">{value}</dd>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="cs-card cs-collapse" open>
      <summary className="cs-card-title">{title}</summary>
      <div className="cs-collapse-body">{children}</div>
    </details>
  );
}

function CheckList({ checks }: { checks: FixtureCheck[] }) {
  return (
    <ul className="cs-fact-list">
      {checks.map((check) => (
        <li key={check.id} className="cs-fact">
          {check.label}: {check.detail} (score {check.score}){" "}
          <StatusBadge label={checkLabel[check.level]} tone={checkTone[check.level]} />
        </li>
      ))}
    </ul>
  );
}

function UnavailableFields({ fields, issuesTitle, description }: { fields: string[]; issuesTitle: string; description: string }) {
  return (
    <>
      <dl className="cs-details">
        {fields.map((field) => (
          <Detail key={field} label={field} value={notAvailable} />
        ))}
      </dl>
      <Collapsible title={issuesTitle}>
        <EmptyState title="Not available" description={description} />
      </Collapsible>
    </>
  );
}

function downloadReport(audit: AuditJob) {
  if (!audit.report) {
    return;
  }
  const blob = new Blob([JSON.stringify(audit.report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${audit.id}-report.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
