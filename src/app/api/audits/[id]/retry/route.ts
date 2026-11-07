import { NextResponse } from "next/server";

import { failureResponse, retryQueuedAudit } from "@/server/audit-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const result = await retryQueuedAudit(params.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.audit);
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
