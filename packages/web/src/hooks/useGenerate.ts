import { useState, useRef, useCallback } from "react";

export interface GenerateState {
  generating: boolean;
  reasoningText: string;
  contentText: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function useGenerate() {
  const [state, setState] = useState<GenerateState>({
    generating: false,
    reasoningText: "",
    contentText: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const startGeneration = useCallback(
    (storyId: string): Promise<{ content: string; reasoning: string; interrupted: boolean }> => {
      return new Promise((resolve) => {
        const abortController = new AbortController();
        abortRef.current = abortController;

        setState({
          generating: true,
          reasoningText: "",
          contentText: "",
        });

        let fullContent = "";
        let fullReasoning = "";
        let interrupted = false;

        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storyId }),
          signal: abortController.signal,
        }).then(async (response) => {
          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: "Unknown error" }));
            setState((s) => ({ ...s, generating: false }));
            resolve({ content: "", reasoning: "", interrupted: false });
            throw new Error(err.error || "Generation failed");
          }

          const reader = response.body?.getReader();
          if (!reader) {
            setState((s) => ({ ...s, generating: false }));
            resolve({ content: "", reasoning: "", interrupted: false });
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            let readResult;
            try {
              readResult = await reader.read();
            } catch {
              interrupted = true;
              break;
            }

            const { done, value } = readResult;
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const event of events) {
              const lines = event.split("\n");
              let eventType = "";
              let dataStr = "";

              for (const line of lines) {
                if (line.startsWith("event: ")) {
                  eventType = line.slice(7);
                } else if (line.startsWith("data: ")) {
                  dataStr = line.slice(6);
                }
              }

              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                if (eventType === "reasoning") {
                  fullReasoning += data.delta;
                  setState((s) => ({ ...s, reasoningText: fullReasoning }));
                } else if (eventType === "content") {
                  fullContent += data.delta;
                  setState((s) => ({ ...s, contentText: fullContent }));
                } else if (eventType === "done") {
                  fullContent = data.fullContent;
                  fullReasoning = data.fullReasoning;
                  setState((s) => ({
                    ...s,
                    generating: false,
                    contentText: fullContent,
                    reasoningText: fullReasoning,
                  }));
                } else if (eventType === "error") {
                  setState((s) => ({ ...s, generating: false }));
                  console.error("Generation error:", data.message);
                }
              } catch {
                // skip unparseable
              }
            }
          }

          if (interrupted) {
            setState((s) => ({
              ...s,
              generating: false,
            }));
          }

          resolve({ content: fullContent, reasoning: fullReasoning, interrupted });
        }).catch((err) => {
          if (err.name === "AbortError") {
            interrupted = true;
          }
          setState((s) => ({ ...s, generating: false }));
          resolve({ content: fullContent, reasoning: fullReasoning, interrupted: true });
        });
      });
    },
    []
  );

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setState({ generating: false, reasoningText: "", contentText: "" });
  }, []);

  return { generateState: state, startGeneration, cancelGeneration, reset };
}
