import express from "express";
import cors from "cors";
import { WorkspaceStore } from "./workspace-store";
import { workspaceRoutes } from "./routes/workspace";
import { generateRoutes } from "./routes/generate";

const PORT = 3001;
const DATA_DIR = process.env.DATA_DIR ?? ".";

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
});

async function main() {
  const store = new WorkspaceStore({ dir: DATA_DIR });
  await store.load();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", workspaceRoutes(store));
  app.use("/api", generateRoutes(store));

  app.use((err: Error, _req: unknown, res: any, _next: unknown) => {
    console.error("[Unhandled Error]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data dir: ${DATA_DIR}`);
  });
}

main().catch(console.error);
