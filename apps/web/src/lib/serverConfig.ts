/**
 * Server-only configuration for the Next.js API routes, which act as the
 * lightweight API Gateway described in ARCHITECTURE.md / STRUCTURE.md,
 * routing browser requests to the ai-service, pdf-service, and ats-service.
 */
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
export const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://localhost:4000";
export const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL ?? "http://localhost:8200";
