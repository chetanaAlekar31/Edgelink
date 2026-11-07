import type { AuditJob, AuditStatus, AuditType, PageSpeedMeasurement } from "@/lib/audits";
import type { SeoReport } from "@/lib/reports";

type PageSpeedPayload = {
  strategy?: string;
  categories?: {
    performance?: { score?: number };
    seo?: { score?: number };
    accessibility?: { score?: number };
  };
  audits?: Record<string, { score?: number; displayValue?: string; description?: string }>;
};

export type ApiAuditRow = {
  id: string;
  clientId: string;
  clientName: string;
  websiteUrl: string;
  auditType: AuditType;
  status: AuditStatus;
  seoScore: number | null;
  createdAt: string;
  completedAt: string | null;
  reportAvailable?: boolean;
  config?: { strategy?: "mobile" | "desktop"; keyword?: string };
  result?: { pagespeed?: PageSpeedPayload | null } | null;
};

export type ApiReportRow = SeoReport & {
  clientName?: string;
  websiteUrl?: string;
  seoScore?: number | null;
  downloadPath?: string | null;
};

function measurement(pagespeed: PageSpeedPayload | null | undefined): PageSpeedMeasurement | null {
  const performance = pagespeed?.categories?.performance?.score;
  const seo = pagespeed?.categories?.seo?.score;
  const accessibility = pagespeed?.categories?.accessibility?.score;
  if (performance === undefined || seo === undefined || accessibility === undefined) return null;
  const audits = pagespeed?.audits ?? {};
  return {
    strategy: pagespeed?.strategy ?? "mobile",
    performance,
    seo,
    accessibility,
    lcp: audits["largest-contentful-paint"]?.displayValue ?? "Not available",
    cls: audits["cumulative-layout-shift"]?.displayValue ?? "Not available",
    inp: audits["interaction-to-next-paint"]?.displayValue ?? "Not available",
    blocking: audits["render-blocking-resources"]?.description ?? "Not available",
    unusedJavaScript: audits["unused-javascript"]?.displayValue ?? "Not available",
  };
}

export function auditJobFromApi(row: ApiAuditRow): AuditJob {
  const pagespeed = measurement(row.result?.pagespeed);
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.clientName,
    websiteUrl: row.websiteUrl,
    auditType: row.auditType,
    status: row.status,
    seoScore: row.seoScore,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    reportAvailable: Boolean(row.reportAvailable),
    report: null,
    config: row.config ?? {},
    pagespeed,
  };
}
