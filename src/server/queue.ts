import { Queue, Worker, type Job } from "bullmq";

import { getRedis } from "@/server/redis";

export const auditQueueName = "seo-audit-jobs";

export type AuditJobData = {
  auditId: string;
};

const globalForQueue = globalThis as unknown as { auditQueue?: Queue<AuditJobData> };

export function getAuditQueue() {
  if (!globalForQueue.auditQueue) {
    globalForQueue.auditQueue = new Queue<AuditJobData>(auditQueueName, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }
  return globalForQueue.auditQueue;
}

export function createAuditWorker(processor: (job: Job<AuditJobData>) => Promise<void>) {
  return new Worker<AuditJobData>(auditQueueName, processor, {
    connection: getRedis(),
    concurrency: 1,
  });
}
