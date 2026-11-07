"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AuditFilters, defaultAuditListFilters, type AuditListFilterValues } from "@/components/audits/audit-filters";
import { RunAuditForm } from "@/components/audits/run-audit-form";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StatusBadge, type BadgeTone } from "@/components/ui/status-badge";
import { updateAudits, useAuditJobs } from "@/lib/audit-store";
import { auditJobFromApi, type ApiAuditRow } from "@/lib/audit-api";
import {
  auditStatusLabel,
  auditTypeLabel,
  formatAuditScore,
  queueAuditAgain,
  type AuditJob,
  type AuditStatus,
  type RunAuditValues,
} from "@/lib/audits";
import { useClientRecords } from "@/lib/client-store";
import { formatClientDate } from "@/lib/clients";

const pageSize = 5;

const statusTone: Record<AuditStatus, BadgeTone> = {
  pending: "warning",
  queued: "info",
  running: "info",
  completed: "success",
  failed: "danger",
};

export function AuditsPage() {
  const clients = useClientRecords();
  const sessionAudits = useAuditJobs();
  const [remoteAudits, setRemoteAudits] = useState<AuditJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [filters, setFilters] = useState<AuditListFilterValues>(defaultAuditListFilters);
  const [applied, setApplied] = useState<AuditListFilterValues>(defaultAuditListFilters);
  const [page, setPage] = useState(1);
  const [running, setRunning] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const remoteRef = useRef(remoteAudits);
  remoteRef.current = remoteAudits;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/audits");
        const payload = (await response.json()) as { audits?: ApiAuditRow[]; error?: string };
        if (!active) return;
        if (!response.ok || !payload.audits) {
          setLoadError(payload.error ?? "Audit records could not be loaded.");
          setLoading(false);
          return;
        }
        setRemoteAudits(payload.audits.map((row) => auditJobFromApi(row)));
        setLoadError("");
        setLoading(false);
      } catch {
        if (!active) return;
        setLoadError("Audit records could not be loaded.");
        setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => {
      if (remoteRef.current.some((audit) => audit.status === "queued" || audit.status === "running")) {
        void load();
      }
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [reloadKey]);

  const audits = useMemo(() => {
    const ids = new Set(remoteAudits.map((audit) => audit.id));
    return [...remoteAudits, ...sessionAudits.filter((audit) => !ids.has(audit.id))];
  }, [remoteAudits, sessionAudits]);

  const filtered = useMemo(() => {
    const query = applied.query.toLowerCase();
    return audits.filter((audit) => {
      const name = (clients.find((client) => client.id === audit.clientId)?.name ?? audit.clientName).toLowerCase();
      const matchesQuery =
        query.length === 0 || name.includes(query) || audit.websiteUrl.toLowerCase().includes(query);
      const matchesStatus = applied.status === "all" || audit.status === applied.status;
      const matchesFrom = applied.from.length === 0 || audit.createdAt >= applied.from;
      const matchesTo = applied.to.length === 0 || audit.createdAt <= applied.to;
      return matchesQuery && matchesStatus && matchesFrom && matchesTo;
    });
  }, [applied, audits, clients]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function clientName(audit: AuditJob) {
    return clients.find((client) => client.id === audit.clientId)?.name ?? audit.clientName;
  }

  const columns: DataTableColumn<AuditJob>[] = [
    { id: "id", header: "Audit ID", cell: (row) => row.id },
    { id: "client", header: "Client name", cell: (row) => clientName(row) },
    { id: "website", header: "Website URL", cell: (row) => row.websiteUrl },
    { id: "type", header: "Audit type", cell: (row) => auditTypeLabel[row.auditType] },
    { id: "score", header: "SEO score", cell: (row) => formatAuditScore(row.seoScore) },
    {
      id: "status",
      header: "Audit status",
      cell: (row) => (
        <span role="status" aria-busy={row.status === "running" ? true : undefined}>
          <StatusBadge label={auditStatusLabel[row.status]} tone={statusTone[row.status]} />
        </span>
      ),
    },
    { id: "created", header: "Created date", cell: (row) => formatClientDate(row.createdAt) },
    {
      id: "completed",
      header: "Completed date",
      cell: (row) => (row.completedAt ? formatClientDate(row.completedAt) : "—"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="cs-filter-actions">
          <Button variant="ghost" asChild>
            <Link href={`/audits/${row.id}`}>View details</Link>
          </Button>
          {row.status === "failed" ? (
            <Button
              variant="outline"
              onClick={() => {
                void retryAudit(row);
              }}
            >
              Retry audit
            </Button>
          ) : null}
          {row.reportAvailable && row.report ? (
            <Button variant="outline" onClick={() => downloadReport(row)}>
              Download report
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  function applyFilters(next: AuditListFilterValues) {
    setFilters(next);
    setApplied(next);
    setPage(1);
  }

  async function queueAudit(values: RunAuditValues) {
    setFormError("");
    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFormError(payload.error ?? "The audit could not be queued.");
        return;
      }
      setRunning(false);
      setPage(1);
      setReloadKey((value) => value + 1);
    } catch {
      setFormError("The audit could not be queued.");
    }
  }

  async function retryAudit(row: AuditJob) {
    try {
      const response = await fetch(`/api/audits/${row.id}/retry`, { method: "POST" });
      if (response.ok) {
        setReloadKey((value) => value + 1);
        return;
      }
      if (response.status === 404) {
        updateAudits((current) => current.map((audit) => (audit.id === row.id ? queueAuditAgain(audit) : audit)));
      }
    } catch {
      setLoadError("The audit could not be queued.");
    }
  }

  return (
    <AppShell title="Audits">
      <PageHeader
        title="SEO audits"
        description="Review audit jobs and queue a new run for a client website."
        breadcrumbs={[
          { label: "Admin", href: "/" },
          { label: "Audits" },
        ]}
        actions={
          <Button variant="primary" onClick={() => setRunning(true)}>
            Run New Audit
          </Button>
        }
      />

      <AuditFilters values={filters} onApply={applyFilters} />

      {loadError ? (
        <div className="cs-card">
          <ErrorState title="Audits unavailable" description={loadError} />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={visible}
        getRowId={(row) => row.id}
        isLoading={loading}
        emptyTitle="No audits found"
        emptyDescription={
          applied.query || applied.status !== "all" || applied.from || applied.to
            ? "No audits match this search, status, or date range."
            : "Run an audit to add the first job in this session."
        }
      />

      <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

      <Sheet open={running} onOpenChange={setRunning}>
        {running ? (
          <SheetContent title="Run new audit" description="The website is validated, an audit record is queued, and the job is added to BullMQ.">
            <RunAuditForm clients={clients} onCancel={() => setRunning(false)} onSubmit={(values) => void queueAudit(values)} />
            {formError ? <p className="cs-field-error">{formError}</p> : null}
          </SheetContent>
        ) : null}
      </Sheet>
    </AppShell>
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
