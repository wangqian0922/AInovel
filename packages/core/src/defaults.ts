import type { Workspace, Story } from "./types";
import { DEFAULT_SETTINGS } from "./types";

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export function createDefaultStory(): Story {
  const storyId = generateId();
  return {
    id: storyId,
    title: "我的故事",
    session: "## 故事纲领\n一段新的冒险开始了。",
    systemInsertPrompt: "请用生动、富有描述性的风格写作。保持角色声音一致。",
    openWorldBookIds: [],
    stateSet: {
      documents: [
        {
          id: generateId(),
          title: "状态",
          content: "## 当前状况\n故事尚未开始。",
          order: 1,
        },
      ],
    },
    historyBuffer: [],
    userInputDraft: "",
  };
}

export function createDefaultWorkspace(): Workspace {
  const story = createDefaultStory();
  return {
    id: generateId(),
    name: "我的工作区",
    worldBooks: [],
    stories: [story],
    activeStoryId: story.id,
    settings: { ...DEFAULT_SETTINGS },
  };
}
