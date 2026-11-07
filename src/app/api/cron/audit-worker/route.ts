import { NextResponse } from "next/server";

import { logError } from "@/server/errors";
import { startAuditWorker } from "@/workers/audit-worker";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const worker = startAuditWorker();
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 8000);
      worker.once("drained", () => {
        clearTimeout(timer);
        resolve(undefined);
      });
    });
    await worker.close();
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("cron", error);
    return NextResponse.json({ error: "The audit worker could not start." }, { status: 503 });
  }
}
