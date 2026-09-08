import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/serverConfig";
import { getSessionId } from "@/lib/session";
import { SESSION_HEADER } from "@/middleware";

/** Feature 1: proxies the uploaded resume file to the ai-service parser. */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const res = await fetch(`${AI_SERVICE_URL}/parse`, {
    method: "POST",
    headers: { [SESSION_HEADER]: getSessionId(req) },
    body: formData,
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
