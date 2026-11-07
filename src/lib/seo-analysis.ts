import { z } from "zod";

const score = z.number().int().min(0).max(100).nullable();

export const recommendationSchema = z.object({
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  category: z.enum(["Technical", "OnPage", "Content", "Schema", "CWV"]),
  finding: z.string().min(1),
  fix: z.string().min(1),
  estimated_impact: z.enum(["High", "Medium", "Low"]),
  effort: z.enum(["Hours", "Days", "Weeks"]),
  falsifiability_check: z.string().min(1),
});

export const issueSchema = z.union([
  z.string().min(1),
  z.object({ finding: z.string().min(1) }).passthrough(),
]);

export const seoAnalysisSchema = z.object({
  audit_version: z.literal("v1.0"),
  overall_score: score,
  score_breakdown: z.object({
    technical: score,
    on_page: score,
    content: score,
    core_web_vitals: score,
    schema: score,
  }),
  critical_issues: z.array(issueSchema).max(5),
  important_issues: z.array(issueSchema).max(8),
  quick_wins: z.array(issueSchema).max(5),
  recommendations: z.array(recommendationSchema),
  executive_summary: z.string().min(1),
});

export type SeoAnalysis = z.infer<typeof seoAnalysisSchema>;

export function issueText(issue: SeoAnalysis["critical_issues"][number]) {
  return typeof issue === "string" ? issue : issue.finding;
}

export function parseSeoAnalysis(value: unknown) {
  return seoAnalysisSchema.parse(value);
}
