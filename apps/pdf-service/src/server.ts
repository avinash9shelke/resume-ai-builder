import { createApp } from "./app";
import { closeBrowser } from "./pdf";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createApp();
const server = app.listen(PORT, () => {
  console.log(`pdf-service listening on port ${PORT}`);
});

async function shutdown() {
  await closeBrowser();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
