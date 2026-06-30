import { Router } from "express";
import type { WorkspaceStore } from "../workspace-store";

export function workspaceRoutes(store: WorkspaceStore): Router {
  const router = Router();

  router.get("/workspace", (_req, res) => {
    res.json(store.get());
  });

  router.put("/workspace", (req, res) => {
    const ws = req.body as Parameters<WorkspaceStore["replace"]>[0];
    store.replace(ws);
    store.save();
    res.json(store.get());
  });

  return router;
}
