import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/serverConfig";

export async function GET() {
  const res = await fetch(`${AI_SERVICE_URL}/resumes`, { cache: "no-store" });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/resumes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
