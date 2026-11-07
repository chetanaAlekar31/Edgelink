import { MissingConfigurationError } from "@/server/errors";
import { parseSeoAnalysis, type SeoAnalysis } from "@/lib/seo-analysis";

const systemPrompt = `You are a senior SEO analyst with 15+ years experience specialising in Indian local business websites, healthcare, dental, and real estate sectors.
You produce honest, falsifiable, prioritised SEO audit reports.
Your output must be valid JSON only — no markdown, no preamble.
Every recommendation must include: finding, fix, estimated_impact (High/Medium/Low), effort (Hours/Days/Weeks), falsifiability_check (how we know if this worked).`;

type PageSpeedAudit = { score?: number; displayValue?: string; description?: string };

export type AnalysisInput = {
  url: string;
  seoScore: number | null;
  performanceScore: number | null;
  onPage: unknown;
  technical: unknown;
  coreWebVitals: unknown;
  schema: unknown;
  searchConsole: unknown;
  rankings: unknown;
};

const fixtureChecks: Array<{ id: string; title: string }> = [
  { id: "largest-contentful-paint", title: "Largest contentful paint" },
  { id: "cumulative-layout-shift", title: "Cumulative layout shift" },
  { id: "interaction-to-next-paint", title: "Interaction to next paint" },
  { id: "render-blocking-resources", title: "Render-blocking resources" },
  { id: "unused-javascript", title: "Unused JavaScript" },
];

function mocksEnabled() {
  return process.env.USE_MOCKS === "true";
}

function scoreOutOf100(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;
  return Math.round(value * 100);
}

function fixtureIssues(coreWebVitals: unknown) {
  const audits =
    coreWebVitals && typeof coreWebVitals === "object" ? (coreWebVitals as Record<string, PageSpeedAudit>) : {};
  const critical: string[] = [];
  const warnings: string[] = [];
  for (const check of fixtureChecks) {
    const audit = audits[check.id];
    if (!audit || typeof audit.score !== "number") continue;
    const detail = audit.displayValue ?? audit.description ?? "Not available";
    const line = `${check.title}: ${detail} (score ${audit.score})`;
    if (audit.score < 0.5) critical.push(line);
    else if (audit.score < 0.9) warnings.push(line);
  }
  return { critical: critical.slice(0, 5), warnings: warnings.slice(0, 8) };
}

function userPrompt(input: AnalysisInput) {
  return `Analyse the following SEO signals for: ${input.url}
Business type: Not available
Business location: Not available

=== ON-PAGE DATA ===
${JSON.stringify(input.onPage)}

=== TECHNICAL DATA ===
${JSON.stringify(input.technical)}

=== CORE WEB VITALS ===
${JSON.stringify(input.coreWebVitals)}

=== SCHEMA.ORG DATA ===
${JSON.stringify(input.schema)}

=== GOOGLE SEARCH CONSOLE ===
${JSON.stringify(input.searchConsole)}

=== KEYWORD RANKINGS ===
${JSON.stringify(input.rankings)}

Respond ONLY with this JSON structure — no other text:
{
  "audit_version": "v1.0",
  "overall_score": <integer 0-100 or null>,
  "score_breakdown": { "technical": <0-100 or null>, "on_page": <0-100 or null>, "content": <0-100 or null>, "core_web_vitals": <0-100 or null>, "schema": <0-100 or null> },
  "critical_issues": [<max 5 items>],
  "important_issues": [<max 8 items>],
  "quick_wins": [<max 5 items, effort <= 2 hours>],
  "recommendations": [{
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "category": "Technical|OnPage|Content|Schema|CWV",
    "finding": "<what is wrong>",
    "fix": "<exact action to take>",
    "estimated_impact": "High|Medium|Low",
    "effort": "Hours|Days|Weeks",
    "falsifiability_check": "<how to verify this worked>"
  }],
  "executive_summary": "<3 sentences max, plain English>"
}`;
}

function mockAnalysis(input: AnalysisInput): SeoAnalysis {
  const issues = fixtureIssues(input.coreWebVitals);
  return parseSeoAnalysis({
    audit_version: "v1.0",
    overall_score: scoreOutOf100(input.seoScore),
    score_breakdown: {
      technical: null,
      on_page: null,
      content: null,
      core_web_vitals: scoreOutOf100(input.performanceScore),
      schema: null,
    },
    critical_issues: issues.critical,
    important_issues: issues.warnings,
    quick_wins: [],
    recommendations: [],
    executive_summary: "Not available",
  });
}

function readClaudeText(payload: unknown) {
  const content = (payload as { content?: Array<{ text?: string }> }).content ?? [];
  const text = content.map((block) => block.text ?? "").join("").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced?.[1]?.trim() || text;
}

export async function analyseSeo(input: AnalysisInput): Promise<SeoAnalysis> {
  if (mocksEnabled()) {
    return mockAnalysis(input);
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingConfigurationError("ANTHROPIC_API_KEY is not configured.");
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt(input) }],
    }),
  });
  if (!response.ok) {
    throw new Error("Claude API request failed.");
  }
  const parsed = JSON.parse(readClaudeText(await response.json())) as unknown;
  return parseSeoAnalysis(parsed);
}
