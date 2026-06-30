import { describe, it, expect } from "vitest";
import { buildApiMessages } from "./api-messages";
import type { Story, WorldBook } from "./types";

function makeTestStory(overrides?: Partial<Story>): Story {
  return {
    id: "story-1",
    title: "Test",
    session: "## Charter\nFantasy.",
    systemInsertPrompt: "Third person.",
    openWorldBookIds: ["wb-1"],
    stateSet: {
      documents: [
        {
          id: "s1",
          title: "State",
          content: "Location: Castle.",
          order: 1,
        },
      ],
    },
    historyBuffer: [
      {
        id: "h1",
        role: "user",
        content: "Continue.",
        reasoningContent: "",
        hidden: false,
        status: "complete",
        createdAt: "",
        updatedAt: "",
      },
    ],
    userInputDraft: "",
    ...overrides,
  };
}

function makeWorldBook(overrides?: Partial<WorldBook>): WorldBook {
  return {
    id: "wb-1",
    name: "Core",
    fixedEntries: [
      { id: "fixed-1", title: "Premise", content: "Magic realm.", order: 1 },
    ],
    keywordEntries: [],
    ...overrides,
  };
}

describe("buildApiMessages", () => {
  it("sends Session, System Insert, WorldBook, StateSet as system messages", () => {
    const messages = buildApiMessages({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "describe the castle",
    });

    const systemMessages = messages.filter((m) => m.role === "system");
    expect(systemMessages).toHaveLength(4);
    expect(systemMessages[0].content).toContain("# Session");
    expect(systemMessages[1].content).toContain("# System Insert Prompt");
    expect(systemMessages[2].content).toContain("# WorldBook.fixed");
    expect(systemMessages[3].content).toContain("# StateSet");
  });

  it("preserves history entry roles", () => {
    const story = makeTestStory({
      historyBuffer: [
        {
          id: "h1",
          role: "user",
          content: "User msg",
          reasoningContent: "",
          hidden: false,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "h2",
          role: "assistant",
          content: "Assistant msg",
          reasoningContent: "thinking",
          hidden: false,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    const messages = buildApiMessages({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const historyMessages = messages.filter(
      (m) => m.role === "user" || m.role === "assistant"
    );
    expect(historyMessages).toHaveLength(2);
    expect(historyMessages[0].role).toBe("user");
    expect(historyMessages[1].role).toBe("assistant");
  });

  it("sends non-empty User Input as final user message", () => {
    const messages = buildApiMessages({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "hello",
    });

    const last = messages[messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toBe("hello");
  });

  it("omits final user message when User Input is empty", () => {
    const story = makeTestStory({
      historyBuffer: [],
    });

    const messages = buildApiMessages({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const userMessages = messages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(0);
  });

  it("excludes reasoning content", () => {
    const story = makeTestStory({
      historyBuffer: [
        {
          id: "h1",
          role: "assistant",
          content: "Visible.",
          reasoningContent: "SECRET",
          hidden: false,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    const messages = buildApiMessages({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const allContent = messages.map((m) => m.content).join(" ");
    expect(allContent).toContain("Visible.");
    expect(allContent).not.toContain("SECRET");
  });

  it("excludes hidden entries", () => {
    const story = makeTestStory({
      historyBuffer: [
        {
          id: "h1",
          role: "user",
          content: "Visible",
          reasoningContent: "",
          hidden: false,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "h2",
          role: "user",
          content: "Hidden",
          reasoningContent: "",
          hidden: true,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    const messages = buildApiMessages({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const allContent = messages.map((m) => m.content).join(" ");
    expect(allContent).toContain("Visible");
    expect(allContent).not.toContain("Hidden");
  });

  it("combines WorldBook.fixed and WorldBook.keyword in one system message", () => {
    const wb: WorldBook = {
      id: "wb-1",
      name: "Test",
      fixedEntries: [{ id: "f1", title: "F", content: "Fixed.", order: 1 }],
      keywordEntries: [
        {
          id: "k1",
          title: "K",
          keywordText: "castle",
          keywords: ["castle"],
          content: "Keyword.",
          order: 1,
        },
      ],
    };

    const story = makeTestStory({
      openWorldBookIds: ["wb-1"],
    });

    const messages = buildApiMessages({
      story,
      worldBooks: [wb],
      historyLimit: 200,
      userInput: "the castle",
    });

    const wbMessage = messages[2];
    expect(wbMessage.content).toContain("# WorldBook.fixed");
    expect(wbMessage.content).toContain("# WorldBook.keyword");
  });
});
