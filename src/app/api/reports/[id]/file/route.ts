import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { failureResponse, getReportFile } from "@/server/audit-service";
import { reportDirectory } from "@/server/pdf";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const filePath = await getReportFile(params.id);
    if (!filePath) {
      return NextResponse.json({ error: "Report file not found." }, { status: 404 });
    }
    const root = path.resolve(reportDirectory());
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(root)) {
      return NextResponse.json({ error: "Report file not found." }, { status: 404 });
    }
    const bytes = await readFile(resolved);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${params.id}.pdf"`,
      },
    });
  } catch (error) {
    const failure = failureResponse(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
