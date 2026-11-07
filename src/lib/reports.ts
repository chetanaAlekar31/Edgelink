export const reportStatuses = ["pending", "generating", "completed", "failed"] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export type SeoReport = {
  id: string;
  clientId: string;
  auditId: string;
  reportType: "seo-audit";
  status: ReportStatus;
  generatedAt: string | null;
  clientName?: string;
  websiteUrl?: string;
  seoScore?: number | null;
  downloadPath?: string | null;
};

export const reportStatusLabel: Record<ReportStatus, string> = {
  pending: "Pending",
  generating: "Generating",
  completed: "Completed",
  failed: "Failed",
};

export const reportTypeLabel: Record<SeoReport["reportType"], string> = {
  "seo-audit": "SEO audit",
};

export function retryReport(report: SeoReport): SeoReport {
  return {
    ...report,
    status: "pending",
    generatedAt: null,
  };
}

export const initialReports: SeoReport[] = [
  {
    id: "report_pagespeed_fixture",
    clientId: "client_example_dental",
    auditId: "audit_pagespeed_fixture",
    reportType: "seo-audit",
    status: "pending",
    generatedAt: null,
  },
];
