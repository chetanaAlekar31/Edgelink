"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { getAuditAssessment, type RankingRow, type SearchQueryRow } from "@/lib/audit-assessment";
import { useAuditJobs } from "@/lib/audit-store";
import { auditStatusLabel, auditTypeLabel } from "@/lib/audits";
import { formatAuditDay, type CheckLevel } from "@/lib/client-dashboard";
import { useClientRecords } from "@/lib/client-store";
import { loadWhatsAppLog, type WhatsAppLog } from "@/lib/fixtures";
import { useReportJobs } from "@/lib/report-store";
import { issueText, seoAnalysisSchema, type SeoAnalysis } from "@/lib/seo-analysis";
import { reportStatusLabel, reportTypeLabel, type ReportStatus } from "@/lib/reports";

const notAvailable = "Not available";
const pdfMessage = "No PDF file is included in the assessment fixture.";

const reportTone: Record<ReportStatus, BadgeTone> = {
  pending: "warning",
  generating: "info",
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
  { id: "absolute", header: "Absolute rank", cell: (row) => String(row.rankAbsolute) },
];

type ReportDetailPageProps = {
  reportId: string;
};

export function ReportDetailPage({ reportId }: ReportDetailPageProps) {
  const reports = useReportJobs();
  const clients = useClientRecords();
  const audits = useAuditJobs();
  const report = reports.find((item) => item.id === reportId) ?? null;
  const client = report ? clients.find((item) => item.id === report.clientId) : undefined;
  const audit = report ? audits.find((item) => item.id === report.auditId) : undefined;
  const assessment = audit ? getAuditAssessment(audit) : null;
  const seoScore = assessment?.health.seo;
  const [whatsApp, setWhatsApp] = useState<WhatsAppLog | null>(null);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SeoAnalysis | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/reports/${reportId}`)
      .then(async (response) => {
        if (!active || !response.ok) {
          if (active) setRemoteReady(true);
          return;
        }
        const payload = (await response.json()) as {
          report?: {
            downloadPath?: string | null;
            result?: { analysis?: unknown } | null;
            notification?: { status: string; sid: string | null } | null;
          };
        };
        const notification = payload.report?.notification;
        if (notification?.status && notification.sid) {
          setWhatsApp({ status: notification.status, sid: notification.sid });
        }
        setDownloadPath(payload.report?.downloadPath ?? null);
        const parsed = seoAnalysisSchema.safeParse(payload.report?.result?.analysis);
        setAnalysis(parsed.success ? parsed.data : null);
        if (active) setRemoteReady(true);
      })
      .catch(() => {
        if (active) setRemoteReady(true);
      });
    return () => {
      active = false;
    };
  }, [reportId]);

  useEffect(() => {
    if (!remoteReady || whatsApp || !report || seoScore === undefined) return;
    let active = true;
    loadWhatsAppLog(report.clientId, seoScore).then((entry) => {
      if (active) setWhatsApp(entry);
    });
    return () => {
      active = false;
    };
  }, [remoteReady, report, seoScore, whatsApp]);

  if (!report) {
    return (
      <AppShell title="Report">
        <PageHeader
          title="Report details"
          description="This report is not in the current session."
          breadcrumbs={[
            { label: "Admin", href: "/" },
            { label: "Reports", href: "/reports" },
            { label: "Missing report" },
          ]}
          actions={
            <Button variant="outline" asChild>
              <Link href="/reports">Back to Reports</Link>
            </Button>
          }
        />
        <EmptyState title="Report not found" description="Open a report from the reports list." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Report">
      <PageHeader
        title={report.id}
        description={`${client?.name ?? audit?.clientName ?? "Client"} · ${audit?.websiteUrl ?? notAvailable}`}
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Reports", href: "/reports" },
          { label: report.id },
        ]}
        actions={
          <div className="cs-filter-actions">
            <Button variant="outline" asChild>
              <Link href="/reports">Back to Reports</Link>
            </Button>
            {audit ? (
              <Button variant="outline" asChild>
                <Link href={`/audits/${audit.id}`}>View audit</Link>
              </Button>
            ) : null}
            {downloadPath ? (
              <Button variant="primary" asChild>
                <a href={downloadPath}>Download PDF</a>
              </Button>
            ) : null}
          </div>
        }
      />
      {downloadPath ? null : <p className="cs-caption">{pdfMessage}</p>}

      <section className="cs-card cs-panel" aria-label="Client information">
        <h2 className="cs-card-title">Client information</h2>
        <dl className="cs-details">
          <Detail label="Client name" value={client?.name ?? notAvailable} />
          <Detail label="Website URL" value={client?.websiteUrl ?? audit?.websiteUrl ?? notAvailable} />
          <Detail label="Domain" value={client?.domain ?? notAvailable} />
          <Detail label="Contact person" value={client?.contactPerson ?? notAvailable} />
          <Detail label="Email" value={client?.email ?? notAvailable} />
          <Detail label="Phone number" value={client?.phone ?? notAvailable} />
        </dl>
      </section>

      <section className="cs-card cs-panel" aria-label="Audit information">
        <h2 className="cs-card-title">Audit information</h2>
        <div className="cs-status-row">
          <StatusBadge label={reportStatusLabel[report.status]} tone={reportTone[report.status]} />
        </div>
        <dl className="cs-details">
          <Detail label="Report ID" value={report.id} />
          <Detail label="Report type" value={reportTypeLabel[report.reportType]} />
          <Detail label="Report status" value={reportStatusLabel[report.status]} />
          <Detail label="Generated date" value={report.generatedAt ? formatAuditDay(report.generatedAt) : notAvailable} />
          <Detail label="Related audit ID" value={report.auditId} />
          <Detail label="Audit status" value={audit ? auditStatusLabel[audit.status] : notAvailable} />
          <Detail label="Audit type" value={audit ? auditTypeLabel[audit.auditType] : notAvailable} />
          <Detail label="Audit date" value={audit ? formatAuditDay(audit.completedAt ?? audit.createdAt) : notAvailable} />
        </dl>
      </section>

      <section className="cs-stat-grid" aria-label="Overall SEO score">
        <StatCard
          label="Overall SEO score"
          value={assessment ? assessment.health.seo : notAvailable}
          hint={assessment ? "PageSpeed SEO category score from the assessment fixture." : "This report has no assessment score."}
        />
      </section>

      <section className="cs-section" aria-label="PageSpeed summary">
        <h2 className="cs-card-title">PageSpeed summary</h2>
        {assessment ? (
          <>
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
          </>
        ) : (
          <EmptyState title="Not available" description="This report is not linked to the PageSpeed fixture." />
        )}
      </section>

      <section className="cs-section" aria-label="Search Console summary">
        <h2 className="cs-card-title">Google Search Console summary</h2>
        {assessment ? (
          <>
            <div className="cs-stat-grid">
              <StatCard label="Clicks" value={assessment.totalClicks} />
              <StatCard label="Impressions" value={assessment.totalImpressions} />
              <StatCard label="Index coverage errors" value={assessment.indexCoverageErrors} />
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
          <EmptyState title="Not available" description="Search Console results belong to the example dental clinic fixture." />
        )}
      </section>

      <section className="cs-section" aria-label="Technical SEO summary">
        <h2 className="cs-card-title">Technical SEO summary</h2>
        <EmptyState
          title="Not available"
          description="The assessment fixture names robots.txt, sitemap, and schema checks, and it does not include their results."
        />
      </section>

      <section className="cs-section" aria-label="On-page SEO summary">
        <h2 className="cs-card-title">On-page SEO summary</h2>
        <EmptyState
          title="Not available"
          description="The assessment fixture does not include title, meta, heading, image, or link results."
        />
      </section>

      <section className="cs-section" aria-label="DataForSEO summary">
        <h2 className="cs-card-title">DataForSEO keyword ranking summary</h2>
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
          <EmptyState title="Not available" description="Ranking results belong to the example dental clinic fixture." />
        )}
      </section>

      <section className="cs-section" aria-label="WhatsApp notification">
        <h2 className="cs-card-title">WhatsApp notification</h2>
        {whatsApp ? (
          <dl className="cs-details">
            <Detail label="Status" value={whatsApp.status} />
            <Detail label="Message SID" value={whatsApp.sid} />
          </dl>
        ) : (
          <EmptyState title="Not available" description="No WhatsApp notification is recorded for this report." />
        )}
      </section>

      <section className="cs-section" aria-label="Recommendations">
        <h2 className="cs-card-title">Recommendations</h2>
        {analysis?.recommendations.length ? (
          <ul className="cs-fact-list">
            {analysis.recommendations.map((item) => (
              <li key={`${item.priority}-${item.finding}`} className="cs-fact">
                {item.priority} · {item.finding} Next step: {item.fix}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Not available"
            description="The assessment describes a recommendations schema and does not include recommendation text."
          />
        )}
        {analysis ? (
          <>
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
          </>
        ) : null}
      </section>
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
