import { readPageSpeed, readRankings, readSearchConsole } from "@/lib/fixtures";

export type AuditStatus = "completed" | "failed" | "pending";

export type AuditRecord = {
  id: string;
  website: string;
  strategy: string;
  status: AuditStatus;
  seo: number;
  performance: number;
  accessibility: number;
  lcp: string;
  cls: string;
  inp: string;
  blocking: string;
  unusedJavaScript: string;
};

export type ClientQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type ScorePoint = {
  label: string;
  value: number;
};

export type AdminDashboardData = {
  clientCount: number;
  clientDomain: string;
  totalAudits: number;
  completedAudits: number;
  failedAudits: number;
  pendingAudits: number;
  scoreOverview: ScorePoint[];
  activity: ScorePoint[];
  audits: AuditRecord[];
  totalClicks: number;
  totalImpressions: number;
  indexCoverageErrors: number;
  keyword: string;
  clientRankPosition: number;
  keywordSearchVolume: number;
  queries: ClientQuery[];
};

export function getAdminDashboard(): AdminDashboardData {
  const pagespeed = readPageSpeed();
  const gsc = readSearchConsole();
  const dataforseo = readRankings();

  if (!pagespeed || !gsc || !dataforseo) {
    return {
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
  }

  const domain = new URL(pagespeed.url).hostname;
  const audits: AuditRecord[] = [
    {
      id: `${pagespeed.url}:${pagespeed.strategy}`,
      website: pagespeed.url,
      strategy: pagespeed.strategy,
      status: "completed",
      seo: pagespeed.categories.seo.score,
      performance: pagespeed.categories.performance.score,
      accessibility: pagespeed.categories.accessibility.score,
      lcp: pagespeed.audits["largest-contentful-paint"].displayValue,
      cls: pagespeed.audits["cumulative-layout-shift"].displayValue,
      inp: pagespeed.audits["interaction-to-next-paint"].displayValue,
      blocking: pagespeed.audits["render-blocking-resources"].description,
      unusedJavaScript: pagespeed.audits["unused-javascript"].displayValue,
    },
  ];

  const keywordResult = dataforseo.tasks[0].result[0];

  return {
    clientCount: 1,
    clientDomain: domain,
    totalAudits: audits.length,
    completedAudits: audits.filter((audit) => audit.status === "completed").length,
    failedAudits: audits.filter((audit) => audit.status === "failed").length,
    pendingAudits: audits.filter((audit) => audit.status === "pending").length,
    scoreOverview: [
      { label: "Performance", value: pagespeed.categories.performance.score },
      { label: "SEO", value: pagespeed.categories.seo.score },
      { label: "Accessibility", value: pagespeed.categories.accessibility.score },
    ],
    activity: [
      { label: "Completed", value: audits.filter((audit) => audit.status === "completed").length },
      { label: "Failed", value: audits.filter((audit) => audit.status === "failed").length },
      { label: "Pending", value: audits.filter((audit) => audit.status === "pending").length },
    ],
    audits,
    totalClicks: gsc.totalClicks,
    totalImpressions: gsc.totalImpressions,
    indexCoverageErrors: gsc.indexCoverageErrors,
    keyword: keywordResult.keyword,
    clientRankPosition: dataforseo.client_rank_position,
    keywordSearchVolume: dataforseo.keyword_search_volume,
    queries: gsc.rows,
  };
}
