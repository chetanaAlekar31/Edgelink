import { Prisma } from "@prisma/client";

import { auditUsesKeyword, auditUsesStrategy, runAuditSchema, type AuditStatus, type AuditType, type RunAuditValues } from "@/lib/audits";
import { ensureClients, getPrisma } from "@/server/db";
import { logError, ServiceUnavailableError } from "@/server/errors";
import { getAuditQueue } from "@/server/queue";

const publicFailure = "The audit service is unavailable.";

export function failureResponse(error: unknown) {
  logError("api", error);
  if (error instanceof ServiceUnavailableError || error instanceof Prisma.PrismaClientInitializationError) {
    return { status: 503 as const, error: publicFailure };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { status: 503 as const, error: publicFailure };
  }
  return { status: 500 as const, error: publicFailure };
}

function dateOnly(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export async function createQueuedAudit(input: RunAuditValues) {
  const parsed = runAuditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, status: 400 as const, error: "Check the client, website URL, and audit type." };
  }
  let website: URL;
  try {
    website = new URL(parsed.data.websiteUrl);
  } catch {
    return { ok: false as const, status: 400 as const, error: "Enter a valid website URL, including https://." };
  }
  if (website.protocol !== "http:" && website.protocol !== "https:") {
    return { ok: false as const, status: 400 as const, error: "Enter a valid website URL, including https://." };
  }

  await ensureClients();
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
  if (!client) {
    return { ok: false as const, status: 400 as const, error: "Select a valid client." };
  }

  const audit = await prisma.seoAudit.create({
    data: {
      clientId: client.id,
      websiteUrl: website.toString().replace(/\/$/, ""),
      auditType: parsed.data.auditType,
      status: "queued",
      strategy: auditUsesStrategy(parsed.data.auditType) && parsed.data.strategy ? parsed.data.strategy : null,
      keyword: auditUsesKeyword(parsed.data.auditType) && parsed.data.keyword ? parsed.data.keyword : null,
      currentStep: "queued",
    },
  });

  try {
    await getAuditQueue().add("audit", { auditId: audit.id }, { jobId: audit.id });
  } catch (error) {
    logError("queue", error);
    await prisma.seoAudit.update({
      where: { id: audit.id },
      data: { status: "failed", currentStep: "failed", errorMessage: "Queue unavailable" },
    });
    return { ok: false as const, status: 503 as const, error: "The audit could not be queued." };
  }

  return { ok: true as const, audit: { id: audit.id, status: audit.status } };
}

export async function retryQueuedAudit(auditId: string) {
  await ensureClients();
  const prisma = getPrisma();
  const audit = await prisma.seoAudit.findUnique({ where: { id: auditId } });
  if (!audit) return { ok: false as const, status: 404 as const, error: "Audit not found." };
  if (audit.status !== "failed") {
    return { ok: false as const, status: 400 as const, error: "Only a failed audit can be retried." };
  }
  await prisma.seoAudit.update({
    where: { id: auditId },
    data: { status: "queued", currentStep: "queued", errorMessage: null, completedAt: null },
  });
  try {
    const queue = getAuditQueue();
    const existing = await queue.getJob(auditId);
    if (existing) await existing.remove();
    await queue.add("audit", { auditId }, { jobId: auditId });
  } catch (error) {
    logError("queue", error);
    await prisma.seoAudit.update({
      where: { id: auditId },
      data: { status: "failed", currentStep: "failed", errorMessage: "Queue unavailable" },
    });
    return { ok: false as const, status: 503 as const, error: "The audit could not be queued." };
  }
  return { ok: true as const, audit: { id: auditId, status: "queued" } };
}

const auditInclude = {
  client: true,
  result: true,
  issues: true,
  recommendations: true,
  report: true,
  notifications: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export async function listAudits() {
  await ensureClients();
  const rows = await getPrisma().seoAudit.findMany({
    include: { client: true, report: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.client.name,
    websiteUrl: row.websiteUrl,
    auditType: row.auditType as AuditType,
    status: row.status as AuditStatus,
    seoScore: row.seoScore,
    createdAt: dateOnly(row.createdAt) ?? "",
    completedAt: dateOnly(row.completedAt),
    reportAvailable: row.report?.status === "completed" && Boolean(row.report.filePath),
    currentStep: row.currentStep,
    config: {
      strategy: row.strategy === "mobile" || row.strategy === "desktop" ? row.strategy : undefined,
      keyword: row.keyword ?? undefined,
    },
  }));
}

export async function getAuditRecord(auditId: string) {
  await ensureClients();
  const row = await getPrisma().seoAudit.findUnique({ where: { id: auditId }, include: auditInclude });
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.client.name,
    websiteUrl: row.websiteUrl,
    auditType: row.auditType,
    status: row.status,
    seoScore: row.seoScore,
    createdAt: dateOnly(row.createdAt),
    completedAt: dateOnly(row.completedAt),
    currentStep: row.currentStep,
    config: { strategy: row.strategy, keyword: row.keyword },
    report: row.report
      ? {
          id: row.report.id,
          status: row.report.status,
          generatedAt: dateOnly(row.report.generatedAt),
          downloadPath: row.report.filePath ? `/api/reports/${row.report.id}/file` : null,
        }
      : null,
    notification: row.notifications[0]
      ? { status: row.notifications[0].status, sid: row.notifications[0].sid }
      : null,
    result: row.result
      ? {
          pagespeed: row.result.pagespeedJson,
          searchConsole: row.result.gscJson,
          rankings: row.result.rankingsJson,
          onPage: row.result.onPageJson,
          technical: row.result.technicalJson,
          schema: row.result.schemaJson,
          analysis: row.result.analysisJson,
        }
      : null,
    issues: row.issues.map((issue) => ({
      title: issue.title,
      detail: issue.detail,
      score: issue.score,
      level: issue.level,
    })),
    recommendations: row.recommendations.map((item) => ({
      priority: item.priority,
      category: item.category,
      finding: item.finding,
      fix: item.fix,
      estimatedImpact: item.estimatedImpact,
      effort: item.effort,
    })),
  };
}

export async function listReports() {
  await ensureClients();
  const rows = await getPrisma().report.findMany({
    include: { client: true, audit: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    clientId: row.clientId,
    clientName: row.client.name,
    auditId: row.auditId,
    websiteUrl: row.audit.websiteUrl,
    seoScore: row.audit.seoScore,
    reportType: "seo-audit" as const,
    status: row.status,
    generatedAt: dateOnly(row.generatedAt),
    downloadPath: row.filePath ? `/api/reports/${row.id}/file` : null,
  }));
}

export async function getReportRecord(reportId: string) {
  await ensureClients();
  const row = await getPrisma().report.findUnique({
    where: { id: reportId },
    include: {
      client: true,
      audit: { include: { result: true, notifications: { orderBy: { createdAt: "desc" }, take: 1 } } },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.client.name,
    websiteUrl: row.audit.websiteUrl,
    domain: row.client.domain,
    email: row.client.email,
    phone: row.client.phone,
    auditId: row.auditId,
    auditType: row.audit.auditType,
    auditStatus: row.audit.status,
    seoScore: row.audit.seoScore,
    reportType: "seo-audit" as const,
    status: row.status,
    generatedAt: dateOnly(row.generatedAt),
    downloadPath: row.filePath ? `/api/reports/${row.id}/file` : null,
    result: row.audit.result
      ? {
          pagespeed: row.audit.result.pagespeedJson,
          searchConsole: row.audit.result.gscJson,
          rankings: row.audit.result.rankingsJson,
          onPage: row.audit.result.onPageJson,
          technical: row.audit.result.technicalJson,
          analysis: row.audit.result.analysisJson,
        }
      : null,
    notification: row.audit.notifications[0]
      ? { status: row.audit.notifications[0].status, sid: row.audit.notifications[0].sid }
      : null,
  };
}

export async function getReportFile(reportId: string) {
  const row = await getPrisma().report.findUnique({ where: { id: reportId } });
  if (!row?.filePath) return null;
  return row.filePath;
}

export async function clientDashboard(clientId: string) {
  await ensureClients();
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return null;
  const audits = await prisma.seoAudit.findMany({
    where: { clientId },
    include: { result: true },
    orderBy: { createdAt: "desc" },
  });
  const latestCompleted = audits.find((audit) => audit.status === "completed" && audit.result?.pagespeedJson);
  return {
    client: {
      id: client.id,
      name: client.name,
      websiteUrl: client.websiteUrl,
      domain: client.domain,
    },
    audits: audits.map((audit) => ({
      id: audit.id,
      clientId: audit.clientId,
      clientName: client.name,
      websiteUrl: audit.websiteUrl,
      auditType: audit.auditType,
      status: audit.status,
      seoScore: audit.seoScore,
      createdAt: dateOnly(audit.createdAt) ?? "",
      completedAt: dateOnly(audit.completedAt),
    })),
    pagespeed: latestCompleted?.result?.pagespeedJson ?? null,
  };
}
