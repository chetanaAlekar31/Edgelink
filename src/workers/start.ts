import { readFileSync } from "fs";

import { logError } from "@/server/errors";
import { startAuditWorker } from "@/workers/audit-worker";

function loadEnvFile() {
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch (error) {
    logError("env", error);
  }
}

loadEnvFile();

const worker = startAuditWorker();
console.log("[audit] worker listening on seo-audit-jobs");

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
