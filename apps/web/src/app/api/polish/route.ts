import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/serverConfig";
import { getSessionId } from "@/lib/session";
import { SESSION_HEADER } from "@/middleware";

/** Feature 3: proxies AI Polish requests to the ai-service LangGraph workflow. */
export async function POST(req: NextRequest) {
  const payload = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/polish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [SESSION_HEADER]: getSessionId(req) },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
