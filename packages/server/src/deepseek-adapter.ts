import { buildApiMessages } from "@ai-novel/core";
import type { Story, WorldBook } from "@ai-novel/core";

export interface GenerateRequest {
  story: Story;
  worldBooks: WorldBook[];
  historyLimit: number;
  userInput: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  reasoningEffort: string;
}

export interface StreamCallbacks {
  onReasoning: (delta: string) => void;
  onContent: (delta: string) => void;
  onDone: (fullContent: string, fullReasoning: string) => void;
  onError: (error: Error) => void;
}

export async function streamGenerate(
  req: GenerateRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  const { story, worldBooks, historyLimit, userInput, apiKey, model, baseUrl, reasoningEffort } = req;

  const messages = buildApiMessages({ story, worldBooks, historyLimit, userInput });

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
  };

  if (reasoningEffort) {
    body.reasoning_effort = reasoningEffort;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let fullReasoning = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.reasoning_content) {
            fullReasoning += delta.reasoning_content;
            callbacks.onReasoning(delta.reasoning_content);
          }

          if (delta.content) {
            fullContent += delta.content;
            callbacks.onContent(delta.content);
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    callbacks.onDone(fullContent, fullReasoning);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[DeepSeek Adapter]", error.message);
    callbacks.onError(error);
  }
}
