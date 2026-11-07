import { Job } from "bullmq";

import { logError } from "@/server/errors";
import { markAuditFailed, processAudit } from "@/server/process-audit";
import { type AuditJobData, createAuditWorker } from "@/server/queue";

export async function handleAuditJob(job: Job<AuditJobData>) {
  try {
    await processAudit(job.data.auditId);
  } catch (error) {
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade + 1 >= attempts) {
      await markAuditFailed(job.data.auditId, error);
    }
    throw error;
  }
}

export function startAuditWorker() {
  const worker = createAuditWorker(handleAuditJob);
  worker.on("error", (error) => logError("redis", error));
  worker.on("failed", (job, error) => logError(job?.id ?? "job", error));
  return worker;
}
