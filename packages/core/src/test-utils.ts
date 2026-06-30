import type { Workspace, Story, WorldBook } from "./types";

export function makeTestStory(overrides?: Partial<Story>): Story {
  return {
    id: "story-1",
    title: "Test Story",
    session: "## Charter\nEpic fantasy tale.",
    systemInsertPrompt: "Write in third person past tense.",
    openWorldBookIds: ["wb-1"],
    stateSet: {
      documents: [
        {
          id: "state-1",
          title: "World State",
          content: "Location: Castle.\nTime: Morning.",
          order: 1,
        },
        {
          id: "state-2",
          title: "Characters",
          content: "Hero: Sir Aldric.",
          order: 2,
        },
      ],
    },
    historyBuffer: [
      {
        id: "hist-1",
        role: "user",
        content: "Continue the story.",
        reasoningContent: "",
        hidden: false,
        status: "complete",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "hist-2",
        role: "assistant",
        content: "The knight rode forth into the mist.",
        reasoningContent: "Have the knight move toward danger.",
        hidden: false,
        status: "complete",
        createdAt: "2026-01-01T00:00:01Z",
        updatedAt: "2026-01-01T00:00:01Z",
      },
    ],
    userInputDraft: "",
    ...overrides,
  };
}

export function makeTestWorldBook(overrides?: Partial<WorldBook>): WorldBook {
  return {
    id: "wb-1",
    name: "Core Setting",
    fixedEntries: [
      {
        id: "fixed-1",
        title: "World Premise",
        content:
          "A realm of ancient magic where kingdoms vie for control of the Crystal Throne.",
        order: 1,
      },
      {
        id: "fixed-2",
        title: "Magic System",
        content:
          "Magic is drawn from elemental crystals. Each crystal attunes to one element: fire, water, earth, or air.",
        order: 2,
      },
    ],
    keywordEntries: [
      {
        id: "kw-1",
        title: "Castle",
        keywordText: "castle fortress",
        keywords: ["castle", "fortress"],
        content:
          "Castle Aldric: seat of House Aldric, built atop a cliff. Its walls bear ancient runes that glow when danger approaches.",
        order: 1,
      },
      {
        id: "kw-2",
        title: "Dragon",
        keywordText: "dragon wyrm",
        keywords: ["dragon", "wyrm"],
        content:
          "Dragons are ancient elemental beings. Each dragon is bound to a specific crystal element.",
        order: 2,
      },
    ],
    ...overrides,
  };
}

export function makeTestWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: "ws-1",
    name: "My Fantasy World",
    worldBooks: [makeTestWorldBook()],
    stories: [makeTestStory()],
    activeStoryId: "story-1",
    settings: {
      historyLimit: 200,
      historyDisplayLimit: 200,
      modelProvider: "deepseek",
      model: "deepseek-v4-flash",
      deepSeekBaseUrl: "https://api.deepseek.com",
      stream: true,
      thinking: true,
      reasoningEffort: "high",
      deepSeekApiKey: "",
    },
    ...overrides,
  };
}
