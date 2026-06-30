import { Router } from "express";
import type { WorkspaceStore } from "../workspace-store";
import { streamGenerate } from "../deepseek-adapter";

export function generateRoutes(store: WorkspaceStore): Router {
  const router = Router();

  router.post("/generate", async (req, res) => {
    const { storyId } = req.body as { storyId: string };

    const ws = store.get();
    const story = ws.stories.find((s) => s.id === storyId);

    if (!story) {
      res.status(400).json({ error: "Story not found" });
      return;
    }

    if (!ws.settings.deepSeekApiKey) {
      res.status(400).json({ error: "DeepSeek API key not configured" });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    let aborted = false;
    res.on("close", () => {
      aborted = true;
    });

    try {
      await streamGenerate(
        {
          story,
          worldBooks: ws.worldBooks,
          historyLimit: ws.settings.historyLimit,
          userInput: story.userInputDraft,
          apiKey: ws.settings.deepSeekApiKey,
          model: ws.settings.model,
          baseUrl: ws.settings.deepSeekBaseUrl,
          reasoningEffort: ws.settings.reasoningEffort,
        },
        {
          onReasoning(delta) {
            if (aborted) return;
            res.write(`event: reasoning\ndata: ${JSON.stringify({ delta })}\n\n`);
          },
          onContent(delta) {
            if (aborted) return;
            res.write(`event: content\ndata: ${JSON.stringify({ delta })}\n\n`);
          },
          onDone(fullContent, fullReasoning) {
            if (aborted) return;
            res.write(
              `event: done\ndata: ${JSON.stringify({ fullContent, fullReasoning })}\n\n`
            );
            res.end();
          },
          onError(error) {
            if (aborted) return;
            res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
            res.end();
          },
        }
      );
    } catch (err) {
      console.error("[Generate Route] Unhandled error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.end();
      }
    }
  });

  return router;
}
