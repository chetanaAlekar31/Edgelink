import { z } from "zod";

import { todayIsoDate } from "@/lib/clients";
import { readPageSpeed } from "@/lib/fixtures";

export const auditStatuses = ["pending", "queued", "running", "completed", "failed"] as const;
export const auditTypes = ["full", "pagespeed", "search_console", "schema", "on_page", "technical", "rankings"] as const;
export const pageSpeedStrategies = ["mobile", "desktop"] as const;

export type AuditStatus = (typeof auditStatuses)[number];
export type AuditType = (typeof auditTypes)[number];
export type PageSpeedStrategy = (typeof pageSpeedStrategies)[number];

export type AuditConfig = {
  strategy?: PageSpeedStrategy;
  keyword?: string;
};

export type PageSpeedMeasurement = {
  strategy: string;
  performance: number;
  seo: number;
  accessibility: number;
  lcp: string;
  cls: string;
  inp: string;
  blocking: string;
  unusedJavaScript: string;
};

export type AuditReport = {
  auditId: string;
  clientName: string;
  websiteUrl: string;
  auditType: AuditType;
  seoScore: number | null;
  completedAt: string | null;
  summary: string;
  pagespeed?: PageSpeedMeasurement;
};

export type AuditJob = {
  id: string;
  clientId: string;
  clientName: string;
  websiteUrl: string;
  auditType: AuditType;
  status: AuditStatus;
  seoScore: number | null;
  createdAt: string;
  completedAt: string | null;
  reportAvailable: boolean;
  report: AuditReport | null;
  config: AuditConfig;
  pagespeed: PageSpeedMeasurement | null;
};

export const auditTypeLabel: Record<AuditType, string> = {
  full: "Full SEO audit",
  pagespeed: "PageSpeed",
  search_console: "Search Console",
  schema: "Schema.org",
  on_page: "On-page",
  technical: "robots.txt and sitemap",
  rankings: "Rankings",
};

export const auditStatusLabel: Record<AuditStatus, string> = {
  pending: "Pending",
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const auditTypeValues = ["full", "pagespeed", "search_console", "schema", "on_page", "technical", "rankings"] as const;

export const runAuditSchema = z.object({
  clientId: z.string().trim().min(1, "Select a client."),
  websiteUrl: z.string().trim().url("Enter a valid website URL, including https://."),
  auditType: z.enum(auditTypeValues, { message: "Select an audit type." }),
  strategy: z.enum(["", "mobile", "desktop"]),
  keyword: z.string().trim().max(120, "Use 120 characters or fewer."),
});

export type RunAuditValues = z.infer<typeof runAuditSchema>;

export const emptyRunAuditValues: RunAuditValues = {
  clientId: "",
  websiteUrl: "",
  auditType: "full",
  strategy: "",
  keyword: "",
};

export function auditUsesStrategy(auditType: RunAuditValues["auditType"]) {
  return auditType === "full" || auditType === "pagespeed";
}

export function auditUsesKeyword(auditType: RunAuditValues["auditType"]) {
  return auditType === "full" || auditType === "rankings";
}

export function formatAuditScore(score: number | null) {
  return score === null ? "—" : String(score);
}

export function createAuditJob(values: RunAuditValues, clientName: string): AuditJob {
  const config: AuditConfig = {};
  if (auditUsesStrategy(values.auditType) && values.strategy) {
    config.strategy = values.strategy;
  }
  if (auditUsesKeyword(values.auditType) && values.keyword) {
    config.keyword = values.keyword;
  }

  const createdAt = todayIsoDate();

  return {
    id: `audit_${crypto.randomUUID()}`,
    clientId: values.clientId,
    clientName,
    websiteUrl: values.websiteUrl,
    auditType: values.auditType,
    status: "queued",
    seoScore: null,
    createdAt,
    completedAt: null,
    reportAvailable: false,
    report: null,
    config,
    pagespeed: null,
  };
}

export function queueAuditAgain(audit: AuditJob): AuditJob {
  return {
    ...audit,
    status: "queued",
    completedAt: null,
    reportAvailable: false,
    report: null,
  };
}

const pagespeed = readPageSpeed();

const fixtureMeasurement: PageSpeedMeasurement | null = pagespeed
  ? {
      strategy: pagespeed.strategy,
      performance: pagespeed.categories.performance.score,
      seo: pagespeed.categories.seo.score,
      accessibility: pagespeed.categories.accessibility.score,
      lcp: pagespeed.audits["largest-contentful-paint"].displayValue,
      cls: pagespeed.audits["cumulative-layout-shift"].displayValue,
      inp: pagespeed.audits["interaction-to-next-paint"].displayValue,
      blocking: pagespeed.audits["render-blocking-resources"].description,
      unusedJavaScript: pagespeed.audits["unused-javascript"].displayValue,
    }
  : null;

function prototypeReport(audit: Omit<AuditJob, "report">, summary: string): AuditReport {
  return {
    auditId: audit.id,
    clientName: audit.clientName,
    websiteUrl: audit.websiteUrl,
    auditType: audit.auditType,
    seoScore: audit.seoScore,
    completedAt: audit.completedAt,
    summary,
    pagespeed: audit.pagespeed ?? undefined,
  };
}

function completedJob(
  job: Omit<AuditJob, "report" | "reportAvailable">,
  summary: string,
  reportAvailable: boolean,
): AuditJob {
  const base = { ...job, reportAvailable, report: null as AuditReport | null };
  if (reportAvailable) {
    base.report = prototypeReport(base, summary);
  }
  return base;
}

export const initialAudits: AuditJob[] = [
  {
    id: "audit_running_orchid",
    clientId: "client_orchid",
    clientName: "Orchid Orthodontics",
    websiteUrl: "https://orchid-ortho.example",
    auditType: "full",
    status: "running",
    seoScore: null,
    createdAt: "2026-08-01",
    completedAt: null,
    reportAvailable: false,
    report: null,
    config: { strategy: "mobile" },
    pagespeed: null,
  },
  {
    id: "audit_queued_smiles",
    clientId: "client_pune_smiles",
    clientName: "Pune Smiles Dental",
    websiteUrl: "https://punesmiles.example",
    auditType: "pagespeed",
    status: "queued",
    seoScore: null,
    createdAt: "2026-07-12",
    completedAt: null,
    reportAvailable: false,
    report: null,
    config: { strategy: "mobile" },
    pagespeed: null,
  },
  completedJob(
    {
      id: "audit_pagespeed_fixture",
      clientId: "client_example_dental",
      clientName: "Example Dental Clinic",
      websiteUrl: pagespeed?.url ?? "https://example-dental-clinic.com",
      auditType: "pagespeed",
      status: "completed",
      seoScore: pagespeed ? pagespeed.categories.seo.score : null,
      createdAt: "2026-06-02",
      completedAt: "2026-06-02",
      config: pagespeed?.strategy === "desktop" || pagespeed?.strategy === "mobile" ? { strategy: pagespeed.strategy } : {},
      pagespeed: fixtureMeasurement,
    },
    "PageSpeed result from the assessment fixture.",
    true,
  ),
  {
    id: "audit_pending_northside",
    clientId: "client_northside",
    clientName: "Northside Dental Studio",
    websiteUrl: "https://northside-dental.example",
    auditType: "schema",
    status: "pending",
    seoScore: null,
    createdAt: "2026-05-20",
    completedAt: null,
    reportAvailable: false,
    report: null,
    config: {},
    pagespeed: null,
  },
  {
    id: "audit_failed_riverstone",
    clientId: "client_river_estate",
    clientName: "Riverstone Estates",
    websiteUrl: "https://riverstone.example",
    auditType: "pagespeed",
    status: "failed",
    seoScore: null,
    createdAt: "2026-04-02",
    completedAt: null,
    reportAvailable: false,
    report: null,
    config: { strategy: "mobile" },
    pagespeed: null,
  },
  completedJob(
    {
      id: "audit_completed_lakeview",
      clientId: "client_lakeview",
      clientName: "Lakeview Family Dental",
      websiteUrl: "https://lakeview-dental.example",
      auditType: "full",
      status: "completed",
      seoScore: 0.72,
      createdAt: "2026-03-18",
      completedAt: "2026-03-19",
      config: { strategy: "desktop", keyword: "family dentist" },
      pagespeed: null,
    },
    "Prototype report stored in this session.",
    true,
  ),
  {
    id: "audit_failed_citycare",
    clientId: "client_citycare",
    clientName: "CityCare Clinic",
    websiteUrl: "https://citycare.example",
    auditType: "rankings",
    status: "failed",
    seoScore: null,
    createdAt: "2026-02-09",
    completedAt: null,
    reportAvailable: false,
    report: null,
    config: { keyword: "clinic near me" },
    pagespeed: null,
  },
  completedJob(
    {
      id: "audit_completed_greenfield",
      clientId: "client_greenfield",
      clientName: "Greenfield Homes",
      websiteUrl: "https://greenfield-homes.example",
      auditType: "on_page",
      status: "completed",
      seoScore: 0.54,
      createdAt: "2026-01-22",
      completedAt: "2026-01-22",
      config: {},
      pagespeed: null,
    },
    "Completed audit with no report file in this session.",
    false,
  ),
];
