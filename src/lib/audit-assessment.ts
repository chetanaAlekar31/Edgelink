import { readRankings, readSearchConsole } from "@/lib/fixtures";
import type { AuditJob } from "@/lib/audits";
import { getFixtureHealth, type FixtureHealth } from "@/lib/client-dashboard";

export type SearchQueryRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type RankingRow = {
  domain: string;
  rankGroup: number;
  rankAbsolute: number;
};

export type AuditAssessment = {
  health: FixtureHealth;
  totalClicks: number;
  totalImpressions: number;
  indexCoverageErrors: number;
  queries: SearchQueryRow[];
  keyword: string;
  clientRankPosition: number;
  keywordSearchVolume: number;
  rankings: RankingRow[];
};

export function getAuditAssessment(audit: AuditJob): AuditAssessment | null {
  if (!audit.pagespeed) {
    return null;
  }

  const health = getFixtureHealth(audit.websiteUrl);
  const gsc = readSearchConsole();
  const dataforseo = readRankings();
  if (!health || !gsc || !dataforseo) {
    return null;
  }

  const keywordResult = dataforseo.tasks[0].result[0];

  return {
    health,
    totalClicks: gsc.totalClicks,
    totalImpressions: gsc.totalImpressions,
    indexCoverageErrors: gsc.indexCoverageErrors,
    queries: gsc.rows,
    keyword: keywordResult.keyword,
    clientRankPosition: dataforseo.client_rank_position,
    keywordSearchVolume: dataforseo.keyword_search_volume,
    rankings: keywordResult.items.map((item: { domain: string; rank_group: number; rank_absolute: number }) => ({
      domain: item.domain,
      rankGroup: item.rank_group,
      rankAbsolute: item.rank_absolute,
    })),
  };
}
