import { useState, useEffect, useCallback, useRef } from "react";
import type { Workspace, Story } from "@ai-novel/core";

const API = "/api/workspace";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Workspace) => {
        setWorkspace(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load workspace", err);
        setLoading(false);
      });
  }, []);

  const save = useCallback(
    (ws: Workspace) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetch(API, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ws),
        }).catch((err) => console.error("Failed to save workspace", err));
      }, 2000);
    },
    []
  );

  const update = useCallback(
    (fn: (ws: Workspace) => Workspace) => {
      setWorkspace((prev) => {
        if (!prev) return prev;
        const next = fn(structuredClone(prev));
        save(next);
        return next;
      });
    },
    [save]
  );

  const activeStory = workspace
    ? workspace.stories.find((s) => s.id === workspace.activeStoryId) ?? null
    : null;

  const setActiveStory = useCallback(
    (storyId: string) => {
      update((ws) => ({ ...ws, activeStoryId: storyId }));
    },
    [update]
  );

  const addStory = useCallback(
    (story: Story) => {
      update((ws) => ({
        ...ws,
        stories: [...ws.stories, story],
        activeStoryId: story.id,
      }));
    },
    [update]
  );

  const deleteStory = useCallback(
    (storyId: string) => {
      update((ws) => {
        const stories = ws.stories.filter((s) => s.id !== storyId);
        const activeStoryId =
          ws.activeStoryId === storyId
            ? stories[0]?.id ?? ""
            : ws.activeStoryId;
        return { ...ws, stories, activeStoryId };
      });
    },
    [update]
  );

  const updateStory = useCallback(
    (storyId: string, partial: Partial<Story>) => {
      update((ws) => ({
        ...ws,
        stories: ws.stories.map((s) =>
          s.id === storyId ? { ...s, ...partial } : s
        ),
      }));
    },
    [update]
  );

  return {
    workspace,
    loading,
    activeStory,
    update,
    setActiveStory,
    addStory,
    deleteStory,
    updateStory,
  };
}
