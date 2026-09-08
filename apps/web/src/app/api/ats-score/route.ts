import { NextRequest, NextResponse } from "next/server";
import { ATS_SERVICE_URL } from "@/lib/serverConfig";

/** Proxies ATS (Applicant Tracking System) score requests to the ats-service. */
export async function POST(req: NextRequest) {
  const resume = await req.json();
  const res = await fetch(`${ATS_SERVICE_URL}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resume),
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
