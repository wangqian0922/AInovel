import express from "express";
import cors from "cors";
import { WorkspaceStore } from "./workspace-store";
import { workspaceRoutes } from "./routes/workspace";
import { generateRoutes } from "./routes/generate";

const PORT = 3001;
const DATA_DIR = process.env.DATA_DIR ?? ".";

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

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data dir: ${DATA_DIR}`);
  });
}

main().catch(console.error);
