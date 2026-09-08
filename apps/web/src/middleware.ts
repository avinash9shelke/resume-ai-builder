import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "session_id";
export const SESSION_HEADER = "x-session-id";

/**
 * Issues an anonymous per-browser session id (no login required) — a random
 * UUID stored in an httpOnly cookie. Also forwards it as a request header so
 * server-side API routes can read it within the same request that first
 * creates it (the cookie itself only becomes visible on the *next* request).
 * ai-service uses this id to scope session bookkeeping and AI response caching.
 */
export function middleware(request: NextRequest) {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existing ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SESSION_HEADER, sessionId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!existing) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: "/:path*",
};
