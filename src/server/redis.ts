import IORedis from "ioredis";

import { ServiceUnavailableError } from "@/server/errors";

const globalForRedis = globalThis as unknown as { redis?: IORedis };

export function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new ServiceUnavailableError("REDIS_URL is not configured.");
  }
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    globalForRedis.redis.on("error", () => {
      // BullMQ and the API log the failed command. Avoid an unhandled error event.
    });
  }
  return globalForRedis.redis;
}
