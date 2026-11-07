import { readPageSpeed } from "@/lib/fixtures";

import type { AuditJob } from "@/lib/audits";
import { formatClientDate } from "@/lib/clients";

export type CheckLevel = "critical" | "warning" | "passed";

export type FixtureCheck = {
  id: string;
  label: string;
  score: number;
  detail: string;
  level: CheckLevel;
};

export type FixtureHealth = {
  strategy: string;
  performance: number;
  seo: number;
  accessibility: number;
  checks: FixtureCheck[];
};

const fixtureAuditId = "audit_pagespeed_fixture";

function checkLevel(score: number): CheckLevel {
  if (score < 0.5) {
    return "critical";
  }
  if (score < 0.9) {
    return "warning";
  }
  return "passed";
}

function sameWebsite(left: string, right: string) {
  try {
    return new URL(left).hostname.replace(/^www\./, "") === new URL(right).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

type PageSpeedPayload = {
  url: string;
  strategy: string;
  categories: {
    performance: { score: number };
    seo: { score: number };
    accessibility: { score: number };
  };
  audits: Record<string, { score: number; displayValue?: string; description?: string }>;
};

export function healthFromPageSpeed(pagespeed: PageSpeedPayload, websiteUrl?: string): FixtureHealth | null {
  if (websiteUrl && pagespeed.url && !sameWebsite(websiteUrl, pagespeed.url)) {
    return null;
  }

  const checks: FixtureCheck[] = [
    {
      id: "largest-contentful-paint",
      label: "Largest contentful paint",
      score: pagespeed.audits["largest-contentful-paint"].score,
      detail: pagespeed.audits["largest-contentful-paint"].displayValue ?? "Not available",
      level: checkLevel(pagespeed.audits["largest-contentful-paint"].score),
    },
    {
      id: "cumulative-layout-shift",
      label: "Cumulative layout shift",
      score: pagespeed.audits["cumulative-layout-shift"].score,
      detail: pagespeed.audits["cumulative-layout-shift"].displayValue ?? "Not available",
      level: checkLevel(pagespeed.audits["cumulative-layout-shift"].score),
    },
    {
      id: "interaction-to-next-paint",
      label: "Interaction to next paint",
      score: pagespeed.audits["interaction-to-next-paint"].score,
      detail: pagespeed.audits["interaction-to-next-paint"].displayValue ?? "Not available",
      level: checkLevel(pagespeed.audits["interaction-to-next-paint"].score),
    },
    {
      id: "render-blocking-resources",
      label: "Render-blocking resources",
      score: pagespeed.audits["render-blocking-resources"].score,
      detail: pagespeed.audits["render-blocking-resources"].description ?? "Not available",
      level: checkLevel(pagespeed.audits["render-blocking-resources"].score),
    },
    {
      id: "unused-javascript",
      label: "Unused JavaScript",
      score: pagespeed.audits["unused-javascript"].score,
      detail: pagespeed.audits["unused-javascript"].displayValue ?? "Not available",
      level: checkLevel(pagespeed.audits["unused-javascript"].score),
    },
  ];

  return {
    strategy: pagespeed.strategy,
    performance: pagespeed.categories.performance.score,
    seo: pagespeed.categories.seo.score,
    accessibility: pagespeed.categories.accessibility.score,
    checks,
  };
}

export function getFixtureHealth(websiteUrl: string): FixtureHealth | null {
  const pagespeed = readPageSpeed();
  if (!pagespeed) return null;
  return healthFromPageSpeed(pagespeed, websiteUrl);
}

export function clientAudits(audits: AuditJob[], clientId: string) {
  return audits
    .filter((audit) => audit.clientId === clientId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id));
}

export function isFixtureAudit(audit: AuditJob) {
  return audit.id === fixtureAuditId;
}

export function formatScore(score: number | null) {
  return score === null ? "—" : String(score);
}

export function formatAuditDay(isoDate: string | null) {
  return isoDate ? formatClientDate(isoDate) : "—";
}
