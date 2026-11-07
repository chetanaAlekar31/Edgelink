import { NextResponse } from "next/server";

import type { RunAuditValues } from "@/lib/audits";
import { createQueuedAudit, failureResponse, listAudits } from "@/server/audit-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const audits = await listAudits();
    return NextResponse.json({ audits });
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function POST(request: Request) {
  let body: RunAuditValues;
  try {
    body = (await request.json()) as RunAuditValues;
  } catch {
    return NextResponse.json({ error: "Check the client, website URL, and audit type." }, { status: 400 });
  }
  try {
    const result = await createQueuedAudit(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.audit, { status: 201 });
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
