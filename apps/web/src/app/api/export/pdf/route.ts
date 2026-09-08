import { NextRequest, NextResponse } from "next/server";
import { PDF_SERVICE_URL } from "@/lib/serverConfig";

/** Feature 6: proxies the resume JSON to the Puppeteer pdf-service and streams back the PDF. */
export async function POST(req: NextRequest) {
  const payload = await req.json();
  const res = await fetch(`${PDF_SERVICE_URL}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: "PDF export failed" }));
    return NextResponse.json(errorBody, { status: res.status });
  }

  const pdfBuffer = await res.arrayBuffer();
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment; filename=resume.pdf",
    },
  });
}
