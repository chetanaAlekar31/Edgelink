import { NextResponse } from "next/server";

import { failureResponse, getAuditRecord } from "@/server/audit-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const audit = await getAuditRecord(params.id);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    }
    return NextResponse.json({ audit });
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
