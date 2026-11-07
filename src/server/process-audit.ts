import { Prisma } from "@prisma/client";

import { ensureClients, getPrisma } from "@/server/db";
import { logError, MissingConfigurationError, ServiceUnavailableError } from "@/server/errors";
import { analyseSeo } from "@/server/claude";
import type { SeoAnalysis } from "@/lib/seo-analysis";
import { analyseOnPage, checkRobotsAndSitemap, crawlUrl, validateSchemaMarkup } from "@/server/crawl";
import { writeAuditPdf } from "@/server/pdf";
import { deliverWhatsApp, loadPageSpeed, loadRankings, loadSearchConsole } from "@/server/providers";

type PageSpeedAudit = { score?: number; displayValue?: string; description?: string };
type PageSpeedPayload = {
  url?: string;
  strategy?: string;
  categories?: {
    performance?: { score?: number };
    seo?: { score?: number };
    accessibility?: { score?: number };
  };
  audits?: Record<string, PageSpeedAudit>;
};

const pageSpeedChecks: Array<{ id: string; title: string }> = [
  { id: "largest-contentful-paint", title: "Largest contentful paint" },
  { id: "cumulative-layout-shift", title: "Cumulative layout shift" },
  { id: "interaction-to-next-paint", title: "Interaction to next paint" },
  { id: "render-blocking-resources", title: "Render-blocking resources" },
  { id: "unused-javascript", title: "Unused JavaScript" },
];

function scoreLevel(score: number) {
  if (score < 0.5) return "critical";
  if (score < 0.9) return "warning";
  return "passed";
}

function numericScore(value: unknown) {
  return typeof value === "number" ? value : null;
}

async function setStep(auditId: string, currentStep: string) {
  await getPrisma().seoAudit.update({
    where: { id: auditId },
    data: { status: "running", currentStep },
  });
}

export async function processAudit(auditId: string) {
  const prisma = getPrisma();
  await ensureClients();
  const audit = await prisma.seoAudit.findUnique({ where: { id: auditId } });
  if (!audit) {
    throw new Error("Audit record was not found.");
  }
  if (audit.status === "completed") {
    return;
  }

  try {
    await setStep(auditId, "crawl");
    const crawl = await crawlUrl(audit.websiteUrl);
    if (!crawl.available && process.env.USE_MOCKS !== "true") {
      throw new Error("The target URL could not be crawled.");
    }

    await setStep(auditId, "pagespeed");
    const pagespeed = (await loadPageSpeed(audit.websiteUrl)) as PageSpeedPayload;

    await setStep(auditId, "search-console");
    const searchConsole = await loadSearchConsole();

    await setStep(auditId, "schema");
    const schema = validateSchemaMarkup(crawl);

    await setStep(auditId, "on-page");
    const onPage = analyseOnPage(crawl);

    await setStep(auditId, "robots-sitemap");
    const technical = await checkRobotsAndSitemap(audit.websiteUrl);
    if (!technical.available && process.env.USE_MOCKS !== "true") {
      throw new Error("robots.txt and sitemap.xml could not be validated.");
    }

    await setStep(auditId, "rankings");
    const rankings = await loadRankings();

    const seoScore = numericScore(pagespeed.categories?.seo?.score);
    const performanceScore = numericScore(pagespeed.categories?.performance?.score);
    await setStep(auditId, "claude");
    const analysis = await analyseSeo({
      url: audit.websiteUrl,
      seoScore,
      performanceScore,
      onPage,
      technical,
      coreWebVitals: pagespeed.audits ?? null,
      schema,
      searchConsole,
      rankings,
    });

    await setStep(auditId, "save");
    await saveResult(auditId, {
      crawl,
      pagespeed,
      searchConsole,
      schema,
      onPage,
      technical,
      rankings,
      analysis,
      seoScore,
    });

    await setStep(auditId, "pdf");
    const client = await prisma.client.findUnique({ where: { id: audit.clientId } });
    const report = await prisma.report.upsert({
      where: { auditId },
      update: { status: "generating", filePath: null, generatedAt: null },
      create: {
        clientId: audit.clientId,
        auditId,
        status: "generating",
      },
    });
    const downloadPath = `/api/reports/${report.id}/file`;
    const filePath = await writeAuditPdf(`${auditId}.pdf`, {
      clientName: client?.name ?? "Not available",
      websiteUrl: audit.websiteUrl,
      auditId,
      auditDate: new Date().toISOString().slice(0, 10),
      seoScore,
      pagespeed,
      searchConsole,
      technical,
      onPage,
      rankings,
      analysis,
      downloadPath,
    });
    await prisma.report.update({
      where: { id: report.id },
      data: { status: "completed", filePath, generatedAt: new Date() },
    });
    await prisma.seoAudit.update({
      where: { id: auditId },
      data: {
        status: "completed",
        currentStep: "completed",
        seoScore,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    try {
      const notification = await deliverWhatsApp(audit.clientId, filePath, seoScore);
      await prisma.whatsAppNotificationLog.create({
        data: {
          clientId: audit.clientId,
          auditId,
          status: notification.status,
          sid: notification.sid,
          pdfPath: filePath,
          score: seoScore,
        },
      });
    } catch (error) {
      logError("whatsapp", error);
      await prisma.whatsAppNotificationLog.create({
        data: {
          clientId: audit.clientId,
          auditId,
          status: "failed",
          pdfPath: filePath,
          score: seoScore,
          errorMessage: "The WhatsApp notification could not be sent.",
        },
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientInitializationError) {
      logError("database", error);
    } else {
      logError(auditId, error);
    }
    throw error;
  }
}

async function saveResult(
  auditId: string,
  payload: {
    crawl: unknown;
    pagespeed: unknown;
    searchConsole: unknown;
    schema: unknown;
    onPage: unknown;
    technical: unknown;
    rankings: unknown;
    analysis: SeoAnalysis;
    seoScore: number | null;
  },
) {
  const prisma = getPrisma();
  await prisma.seoIssue.deleteMany({ where: { auditId } });
  await prisma.seoRecommendation.deleteMany({ where: { auditId } });
  await prisma.auditResult.upsert({
    where: { auditId },
    update: {
      crawlJson: payload.crawl as Prisma.InputJsonValue,
      pagespeedJson: payload.pagespeed as Prisma.InputJsonValue,
      gscJson: payload.searchConsole as Prisma.InputJsonValue,
      schemaJson: payload.schema as Prisma.InputJsonValue,
      onPageJson: payload.onPage as Prisma.InputJsonValue,
      technicalJson: payload.technical as Prisma.InputJsonValue,
      rankingsJson: payload.rankings as Prisma.InputJsonValue,
      analysisJson: payload.analysis as Prisma.InputJsonValue,
    },
    create: {
      auditId,
      crawlJson: payload.crawl as Prisma.InputJsonValue,
      pagespeedJson: payload.pagespeed as Prisma.InputJsonValue,
      gscJson: payload.searchConsole as Prisma.InputJsonValue,
      schemaJson: payload.schema as Prisma.InputJsonValue,
      onPageJson: payload.onPage as Prisma.InputJsonValue,
      technicalJson: payload.technical as Prisma.InputJsonValue,
      rankingsJson: payload.rankings as Prisma.InputJsonValue,
      analysisJson: payload.analysis as Prisma.InputJsonValue,
    },
  });

  const pagespeed = payload.pagespeed as PageSpeedPayload;
  const issues = pageSpeedChecks.flatMap((check) => {
    const audit = pagespeed.audits?.[check.id];
    if (!audit || typeof audit.score !== "number") return [];
    return [
      {
        auditId,
        source: "pagespeed",
        title: check.title,
        detail: audit.displayValue ?? audit.description ?? "Not available",
        score: audit.score,
        level: scoreLevel(audit.score),
      },
    ];
  });
  if (issues.length > 0) {
    await prisma.seoIssue.createMany({ data: issues });
  }

  const recommendations = payload.analysis.recommendations.filter(
    (item) => item.finding && item.fix && item.priority && item.category,
  );
  if (recommendations.length > 0) {
    await prisma.seoRecommendation.createMany({
      data: recommendations.map((item) => ({
        auditId,
        priority: item.priority,
        category: item.category,
        finding: item.finding,
        fix: item.fix,
        estimatedImpact: item.estimated_impact,
        effort: item.effort,
        falsifiabilityCheck: item.falsifiability_check,
      })),
    });
  }
}

export async function markAuditFailed(auditId: string, error: unknown) {
  const message =
    error instanceof MissingConfigurationError || error instanceof ServiceUnavailableError
      ? error.message
      : "The audit pipeline failed.";
  try {
    const prisma = getPrisma();
    const existing = await prisma.seoAudit.findUnique({ where: { id: auditId } });
    if (!existing || existing.status === "completed") return;
    await prisma.seoAudit.update({
      where: { id: auditId },
      data: { status: "failed", currentStep: "failed", errorMessage: message },
    });
    await prisma.report.updateMany({
      where: { auditId, status: { in: ["pending", "generating"] } },
      data: { status: "failed" },
    });
  } catch (databaseError) {
    logError("mark-failed", databaseError);
  }
}
