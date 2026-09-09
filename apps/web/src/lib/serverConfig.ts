/**
 * Server-only configuration for the Next.js API routes, which act as the
 * lightweight API Gateway described in ARCHITECTURE.md / STRUCTURE.md,
 * routing requests to the ai-service, pdf-service, and ats-service
 * processes. All of these run as sibling processes inside the same
 * container (see root Dockerfile / docker/supervisord.conf), so they're
 * reached over localhost rather than a docker-compose network hostname.
 */
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";
export const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://127.0.0.1:4000";
export const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL ?? "http://127.0.0.1:8200";
