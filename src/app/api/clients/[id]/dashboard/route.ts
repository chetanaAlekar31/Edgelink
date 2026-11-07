import { NextResponse } from "next/server";

import { clientDashboard, failureResponse } from "@/server/audit-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const dashboard = await clientDashboard(params.id);
    if (!dashboard) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json(dashboard);
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
