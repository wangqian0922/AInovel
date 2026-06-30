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

    let aborted = false;
    req.on("close", () => {
      aborted = true;
    });

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
  });

  return router;
}
