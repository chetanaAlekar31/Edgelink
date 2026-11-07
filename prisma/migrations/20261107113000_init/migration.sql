-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "auditStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoAudit" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "auditType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "strategy" TEXT,
    "keyword" TEXT,
    "currentStep" TEXT,
    "errorMessage" TEXT,
    "seoScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SeoAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditResult" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "crawlJson" JSONB,
    "pagespeedJson" JSONB,
    "gscJson" JSONB,
    "schemaJson" JSONB,
    "onPageJson" JSONB,
    "technicalJson" JSONB,
    "rankingsJson" JSONB,
    "analysisJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoIssue" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoRecommendation" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "estimatedImpact" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "falsifiabilityCheck" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL DEFAULT 'seo-audit',
    "status" TEXT NOT NULL,
    "filePath" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppNotificationLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "auditId" TEXT,
    "status" TEXT NOT NULL,
    "sid" TEXT,
    "pdfPath" TEXT,
    "score" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditResult_auditId_key" ON "AuditResult"("auditId");

-- CreateIndex
CREATE INDEX "SeoAudit_clientId_createdAt_idx" ON "SeoAudit"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "SeoAudit_status_idx" ON "SeoAudit"("status");

-- CreateIndex
CREATE INDEX "SeoIssue_auditId_idx" ON "SeoIssue"("auditId");

-- CreateIndex
CREATE INDEX "SeoRecommendation_auditId_idx" ON "SeoRecommendation"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_auditId_key" ON "Report"("auditId");

-- CreateIndex
CREATE INDEX "Report_clientId_idx" ON "Report"("clientId");

-- CreateIndex
CREATE INDEX "WhatsAppNotificationLog_clientId_idx" ON "WhatsAppNotificationLog"("clientId");

-- CreateIndex
CREATE INDEX "WhatsAppNotificationLog_auditId_idx" ON "WhatsAppNotificationLog"("auditId");

-- AddForeignKey
ALTER TABLE "SeoAudit" ADD CONSTRAINT "SeoAudit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditResult" ADD CONSTRAINT "AuditResult_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoIssue" ADD CONSTRAINT "SeoIssue_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoRecommendation" ADD CONSTRAINT "SeoRecommendation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppNotificationLog" ADD CONSTRAINT "WhatsAppNotificationLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppNotificationLog" ADD CONSTRAINT "WhatsAppNotificationLog_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SeoAudit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
