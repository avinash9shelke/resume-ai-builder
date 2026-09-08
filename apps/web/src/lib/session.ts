import type { NextRequest } from "next/server";
import { SESSION_HEADER } from "@/middleware";

/**
 * Reads the anonymous session id that `middleware.ts` attached to this
 * request, for forwarding to ai-service (which uses it to scope session
 * bookkeeping and AI response caching per browser/session).
 */
export function getSessionId(req: NextRequest): string {
  return req.headers.get(SESSION_HEADER) ?? "anonymous";
}
