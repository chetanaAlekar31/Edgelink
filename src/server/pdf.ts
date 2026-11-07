import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";

import { issueText, type SeoAnalysis } from "@/lib/seo-analysis";

export function reportDirectory() {
  return path.join(process.cwd(), "tmp", "reports");
}

const notAvailable = "Not available";

type PageSpeedAudit = { score?: number; displayValue?: string; description?: string };
type PageSpeedPayload = {
  strategy?: string;
  categories?: {
    performance?: { score?: number };
    seo?: { score?: number };
    accessibility?: { score?: number };
  };
  audits?: Record<string, PageSpeedAudit>;
};
type SearchConsolePayload = {
  totalClicks?: number;
  totalImpressions?: number;
  indexCoverageErrors?: number;
  rows?: Array<{ query?: string; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
};
type RankingsPayload = {
  client_rank_position?: number;
  keyword_search_volume?: number;
  tasks?: Array<{ result?: Array<{ keyword?: string; items?: Array<{ domain?: string; rank_group?: number; rank_absolute?: number }> }> }>;
};

export type AuditPdfDocument = {
  clientName: string;
  websiteUrl: string;
  auditId: string;
  auditDate: string;
  seoScore: number | null;
  pagespeed: unknown;
  searchConsole: unknown;
  technical: unknown;
  onPage: unknown;
  rankings: unknown;
  analysis: SeoAnalysis;
  downloadPath: string;
};

function textOf(value: unknown) {
  if (value === null || value === undefined || value === "") return notAvailable;
  return String(value);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0b1f33").text(title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(11).fillColor("#1e2936");
}

function line(doc: PDFKit.PDFDocument, label: string, value: unknown) {
  doc.text(`${label}: ${textOf(value)}`);
}

function list(doc: PDFKit.PDFDocument, items: string[]) {
  if (items.length === 0) {
    doc.text(notAvailable);
    return;
  }
  items.forEach((item) => doc.text(`• ${item}`));
}

export async function writeAuditPdf(fileName: string, report: AuditPdfDocument) {
  const directory = reportDirectory();
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  const pagespeed = (report.pagespeed ?? {}) as PageSpeedPayload;
  const searchConsole = (report.searchConsole ?? {}) as SearchConsolePayload;
  const rankings = (report.rankings ?? {}) as RankingsPayload;
  const keyword = rankings.tasks?.[0]?.result?.[0];
  const onPage = report.onPage as { available?: boolean } | null;
  const technical = report.technical as { available?: boolean } | null;

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#0d9488").text("EDGELINK TECHNOLOGY");
    doc.font("Helvetica").fontSize(12).fillColor("#1e2936").text("SEO audit report");
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#5b6770").text(
      report.analysis.executive_summary === notAvailable
        ? "Mock mode did not call Claude. Scores and issue lines are the assessment fixture. Recommendation text was not provided."
        : "Analysis returned by the configured Claude API.",
    );

    section(doc, "Client and audit");
    line(doc, "Client", report.clientName);
    line(doc, "Website URL", report.websiteUrl);
    line(doc, "Audit ID", report.auditId);
    line(doc, "Audit date", report.auditDate);
    line(doc, "PageSpeed SEO score", report.seoScore);
    line(doc, "Report link", report.downloadPath);

    section(doc, "Overall SEO score");
    line(doc, "Overall score (0-100)", report.analysis.overall_score);
    line(doc, "Technical", report.analysis.score_breakdown.technical);
    line(doc, "On-page", report.analysis.score_breakdown.on_page);
    line(doc, "Content", report.analysis.score_breakdown.content);
    line(doc, "Core Web Vitals", report.analysis.score_breakdown.core_web_vitals);
    line(doc, "Schema", report.analysis.score_breakdown.schema);
    doc.moveDown(0.3);
    doc.text(`Summary: ${report.analysis.executive_summary}`);

    section(doc, "PageSpeed summary");
    line(doc, "Strategy", pagespeed.strategy);
    line(doc, "Performance", pagespeed.categories?.performance?.score);
    line(doc, "SEO", pagespeed.categories?.seo?.score);
    line(doc, "Accessibility", pagespeed.categories?.accessibility?.score);
    const audits = pagespeed.audits ?? {};
    for (const [name, audit] of Object.entries(audits)) {
      line(doc, name, audit.displayValue ?? audit.description ?? audit.score);
    }

    section(doc, "Google Search Console summary");
    line(doc, "Clicks", searchConsole.totalClicks);
    line(doc, "Impressions", searchConsole.totalImpressions);
    line(doc, "Index coverage errors", searchConsole.indexCoverageErrors);
    (searchConsole.rows ?? []).forEach((row) => {
      doc.text(`${textOf(row.query)} — clicks ${textOf(row.clicks)}, impressions ${textOf(row.impressions)}, CTR ${textOf(row.ctr)}, position ${textOf(row.position)}`);
    });
    if (!searchConsole.rows?.length) doc.text(notAvailable);

    section(doc, "Technical SEO findings");
    doc.text(technical?.available ? JSON.stringify(technical) : notAvailable);

    section(doc, "On-page SEO findings");
    doc.text(onPage?.available ? JSON.stringify(onPage) : notAvailable);

    section(doc, "DataForSEO keyword rankings");
    line(doc, "Keyword", keyword?.keyword);
    line(doc, "Client rank", rankings.client_rank_position);
    line(doc, "Search volume", rankings.keyword_search_volume);
    (keyword?.items ?? []).forEach((item) => {
      doc.text(`${textOf(item.domain)} — group ${textOf(item.rank_group)}, absolute ${textOf(item.rank_absolute)}`);
    });

    section(doc, "Claude analysis");
    line(doc, "Summary", report.analysis.executive_summary);
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").text("Critical issues");
    doc.font("Helvetica");
    list(doc, report.analysis.critical_issues.map(issueText));
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").text("Warnings");
    doc.font("Helvetica");
    list(doc, report.analysis.important_issues.map(issueText));
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").text("Suggested next steps");
    doc.font("Helvetica");
    list(doc, report.analysis.quick_wins.map(issueText));

    section(doc, "Recommendations");
    if (report.analysis.recommendations.length === 0) {
      doc.text(notAvailable);
    } else {
      report.analysis.recommendations.forEach((item) => {
        doc.moveDown(0.3);
        doc.font("Helvetica-Bold").text(`${item.priority} · ${item.category}`);
        doc.font("Helvetica").text(`Finding: ${item.finding}`);
        doc.text(`Fix: ${item.fix}`);
        doc.text(`Impact: ${item.estimated_impact}. Effort: ${item.effort}.`);
        doc.text(`Check: ${item.falsifiability_check}`);
      });
    }

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
    doc.on("error", reject);
  });

  return filePath;
}
