/**
 * Server-only configuration for the Next.js API routes, which act as the
 * lightweight API Gateway described in ARCHITECTURE.md / STRUCTURE.md,
 * routing browser requests to the ai-service, pdf-service, and ats-service.
 */
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "https://unincinerated-wava-semimanneristic.ngrok-free.dev";
export const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "https://unincinerated-wava-semimanneristic.ngrok-free.dev";
export const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL ?? "https://unincinerated-wava-semimanneristic.ngrok-free.dev";
