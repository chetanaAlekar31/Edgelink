import { readFileSync } from "fs";

import EmbeddedPostgres from "embedded-postgres";
import { RedisMemoryServer } from "redis-memory-server";
import { execFileSync } from "child_process";

function loadEnvFile() {
  const text = readFileSync(".env", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match) continue;
    process.env[match[1]] = match[2];
  }
}

loadEnvFile();
process.env.USE_MOCKS = "true";

async function main() {
const postgres = new EmbeddedPostgres({
  databaseDir: "./data/pg",
  user: "postgres",
  password: "postgres",
  port: 54329,
  persistent: true,
});
await postgres.initialise().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already|exist/i.test(message)) throw error;
});
await postgres.start();
try {
  await postgres.createDatabase("seo_automation");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) throw error;
}

const redis = new RedisMemoryServer({ instance: { port: 63799, ip: "127.0.0.1" } });
await redis.getHost();
await redis.getPort();

execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: true });

const { createQueuedAudit } = await import("../src/server/audit-service");
const { getPrisma } = await import("../src/server/db");
const { getRedis } = await import("../src/server/redis");
const { startAuditWorker } = await import("../src/workers/audit-worker");

const worker = startAuditWorker();
const queued = await createQueuedAudit({
  clientId: "client_example_dental",
  websiteUrl: "https://example-dental-clinic.com",
  auditType: "full",
  strategy: "mobile",
  keyword: "dental clinic pune",
});
if (!queued.ok) {
  throw new Error(queued.error);
}

const prisma = getPrisma();
const started = Date.now();
let audit = await prisma.seoAudit.findUnique({ where: { id: queued.audit.id }, include: { report: true } });
while (audit && audit.status !== "completed" && audit.status !== "failed" && Date.now() - started < 30000) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  audit = await prisma.seoAudit.findUnique({ where: { id: queued.audit.id }, include: { report: true } });
}

console.log(
  JSON.stringify(
    {
      auditId: audit?.id,
      clientId: audit?.clientId,
      status: audit?.status,
      step: audit?.currentStep,
      seoScore: audit?.seoScore,
      reportId: audit?.report?.id,
      reportStatus: audit?.report?.status,
      error: audit?.errorMessage,
    },
    null,
    2,
  ),
);

await Promise.race([worker.close(), new Promise((resolve) => setTimeout(resolve, 2000))]);
getRedis().disconnect();
await prisma.$disconnect();
await redis.stop();
await postgres.stop();

if (!audit || audit.status !== "completed" || audit.clientId !== "client_example_dental" || audit.report?.auditId !== audit.id) {
  process.exit(1);
}
process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
