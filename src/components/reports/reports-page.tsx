"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ReportFilters, defaultReportFilters, type ReportFilterValues } from "@/components/reports/report-filters";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { getAuditAssessment } from "@/lib/audit-assessment";
import { useAuditJobs } from "@/lib/audit-store";
import { useClientRecords } from "@/lib/client-store";
import { formatAuditDay } from "@/lib/client-dashboard";
import { updateReports, useReportJobs } from "@/lib/report-store";
import { reportStatusLabel, reportTypeLabel, retryReport, type ReportStatus, type SeoReport } from "@/lib/reports";

const pageSize = 5;
const notAvailable = "Not available";
const pdfMessage = "No PDF file is included in the assessment fixture.";

const statusTone: Record<ReportStatus, BadgeTone> = {
  pending: "warning",
  generating: "info",
  completed: "success",
  failed: "danger",
};

export type ReportsPhase = "ready" | "loading" | "empty" | "error";

type ReportsPageProps = {
  phase?: ReportsPhase;
};

export function ReportsPage({ phase = "ready" }: ReportsPageProps) {
  const clients = useClientRecords();
  const audits = useAuditJobs();
  const sessionReports = useReportJobs();
  const [remoteReports, setRemoteReports] = useState<SeoReport[]>([]);
  const [apiError, setApiError] = useState("");
  const [apiLoading, setApiLoading] = useState(phase === "ready");
  const [filters, setFilters] = useState<ReportFilterValues>(defaultReportFilters);
  const [applied, setApplied] = useState<ReportFilterValues>(defaultReportFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (phase !== "ready") return;
    let active = true;
    fetch("/api/reports")
      .then(async (response) => {
        const payload = (await response.json()) as { reports?: SeoReport[]; error?: string };
        if (!active) return;
        if (!response.ok || !payload.reports) {
          setApiError(payload.error ?? "Reports could not be loaded.");
          setApiLoading(false);
          return;
        }
        setRemoteReports(payload.reports);
        setApiError("");
        setApiLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setApiError("Reports could not be loaded.");
        setApiLoading(false);
      });
    return () => {
      active = false;
    };
  }, [phase]);

  const reports = useMemo(() => {
    const ids = new Set(remoteReports.map((report) => report.id));
    return [...remoteReports, ...sessionReports.filter((report) => !ids.has(report.id))];
  }, [remoteReports, sessionReports]);

  const filtered = useMemo(() => {
    const source = phase === "empty" ? [] : reports;
    const query = applied.query.toLowerCase();
    return source.filter((report) => {
      const client = clients.find((item) => item.id === report.clientId);
      const audit = audits.find((item) => item.id === report.auditId);
      const name = (client?.name ?? audit?.clientName ?? "").toLowerCase();
      const domain = (client?.domain ?? "").toLowerCase();
      const website = (audit?.websiteUrl ?? client?.websiteUrl ?? "").toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        name.includes(query) ||
        domain.includes(query) ||
        website.includes(query) ||
        report.id.toLowerCase().includes(query);
      const matchesClient = applied.clientId === "all" || report.clientId === applied.clientId;
      const matchesStatus = applied.status === "all" || report.status === applied.status;
      const generated = report.generatedAt ?? "";
      const matchesFrom = applied.from.length === 0 || (generated.length > 0 && generated >= applied.from);
      const matchesTo = applied.to.length === 0 || (generated.length > 0 && generated <= applied.to);
      return matchesQuery && matchesClient && matchesStatus && matchesFrom && matchesTo;
    });
  }, [applied, audits, clients, phase, reports]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isLoading = phase === "loading" || apiLoading;

  const columns: DataTableColumn<SeoReport>[] = [
    { id: "id", header: "Report ID", cell: (row) => row.id },
    {
      id: "client",
      header: "Client name",
      cell: (row) => row.clientName ?? clients.find((item) => item.id === row.clientId)?.name ?? notAvailable,
    },
    {
      id: "website",
      header: "Website URL",
      cell: (row) => row.websiteUrl ?? audits.find((item) => item.id === row.auditId)?.websiteUrl ?? notAvailable,
    },
    {
      id: "audit",
      header: "Related audit ID",
      cell: (row) => (
        <Link className="cs-crumb-link" href={`/audits/${row.auditId}`}>
          {row.auditId}
        </Link>
      ),
    },
    {
      id: "score",
      header: "SEO score",
      cell: (row) => {
        const audit = audits.find((item) => item.id === row.auditId);
        const assessment = audit ? getAuditAssessment(audit) : null;
        if (typeof row.seoScore === "number") return String(row.seoScore);
        return assessment ? String(assessment.health.seo) : notAvailable;
      },
    },
    { id: "type", header: "Report type", cell: (row) => reportTypeLabel[row.reportType] },
    {
      id: "status",
      header: "Report status",
      cell: (row) => (
        <span role="status" aria-busy={row.status === "generating" ? true : undefined}>
          <StatusBadge label={reportStatusLabel[row.status]} tone={statusTone[row.status]} />
        </span>
      ),
    },
    {
      id: "generated",
      header: "Generated date",
      cell: (row) => (row.generatedAt ? formatAuditDay(row.generatedAt) : notAvailable),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="cs-filter-actions">
          <Button variant="ghost" asChild>
            <Link href={`/reports/${row.id}`}>View report</Link>
          </Button>
          {row.downloadPath ? (
            <Button variant="outline" asChild>
              <a href={row.downloadPath}>Download PDF</a>
            </Button>
          ) : (
            <Button variant="outline" disabled title={pdfMessage}>
              Download PDF
            </Button>
          )}
          {row.status === "failed" ? (
            <Button
              variant="outline"
              onClick={() => {
                updateReports((current) => current.map((report) => (report.id === row.id ? retryReport(report) : report)));
              }}
            >
              Retry generation
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const filteredEmpty = Boolean(applied.query || applied.clientId !== "all" || applied.status !== "all" || applied.from || applied.to);

  return (
    <AppShell title="Reports">
      <PageHeader
        title="Reports"
        description="SEO audit reports linked to clients. The assessment fixture does not include a PDF file."
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Reports" },
        ]}
      />

      {phase === "error" || apiError ? (
        <div className="cs-card">
          <ErrorState
            title="Reports unavailable"
            description={apiError || "Reports could not be loaded."}
          />
        </div>
      ) : null}
      {phase === "error" ? null : (
        <>
          <ReportFilters
            clients={clients}
            values={filters}
            onApply={(next) => {
              setFilters(next);
              setApplied(next);
              setPage(1);
            }}
          />
          <DataTable
            columns={columns}
            rows={visible}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            emptyTitle={phase === "empty" ? "No reports" : "No reports found"}
            emptyDescription={
              phase === "empty"
                ? "The empty view has no report rows."
                : filteredEmpty
                  ? "No reports match this search, client, status, or date range."
                  : "No report is linked to an assessment fixture."
            }
          />
          {isLoading ? null : <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />}
        </>
      )}
    </AppShell>
  );
}
