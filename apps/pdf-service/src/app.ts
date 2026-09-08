import cors from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import { ResumeSchema } from "@resume-ai/schema";
import { htmlToPdf } from "./pdf";
import { renderResumeHtml } from "./templateEngine";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.post(
    "/render",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parseResult = ResumeSchema.safeParse(req.body);
        if (!parseResult.success) {
          res.status(400).json({ error: parseResult.error.flatten() });
          return;
        }

        const html = renderResumeHtml(parseResult.data);
        const pdfBuffer = await htmlToPdf(html);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${(parseResult.data.title || "resume").replace(/[^a-z0-9-_]+/gi, "_")}.pdf"`,
        );
        res.send(pdfBuffer);
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    "/render/html",
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const parseResult = ResumeSchema.safeParse(req.body);
        if (!parseResult.success) {
          res.status(400).json({ error: parseResult.error.flatten() });
          return;
        }
        res.setHeader("Content-Type", "text/html");
        res.send(renderResumeHtml(parseResult.data));
      } catch (err) {
        next(err);
      }
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
