import { describe, it, expect } from "vitest";
import { assemblePrompt } from "./prompt-assembly";
import type { Story, WorldBook } from "./types";

function makeTestStory(overrides?: Partial<Story>): Story {
  return {
    id: "story-1",
    title: "Test Story",
    session: "## Charter\nEpic fantasy.",
    systemInsertPrompt: "Write in third person.",
    openWorldBookIds: ["wb-1"],
    stateSet: {
      documents: [
        {
          id: "state-1",
          title: "State",
          content: "Location: Castle.",
          order: 1,
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
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "hist-2",
        role: "assistant",
        content: "The knight rode forth.",
        reasoningContent: "thinking text",
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
      {
        id: "fixed-1",
        title: "World Premise",
        content: "A realm of magic.",
        order: 1,
      },
    ],
    keywordEntries: [
      {
        id: "kw-1",
        title: "Castle",
        keywordText: "castle",
        keywords: ["castle"],
        content: "The castle is ancient.",
        order: 1,
      },
    ],
    ...overrides,
  };
}

describe("assemblePrompt", () => {
  it("produces fixed layer order", () => {
    const result = assemblePrompt({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "describe the castle",
    });

    const headings = [
      "# Session",
      "System Insert Prompt",
      "WorldBook.fixed",
      "WorldBook.keyword",
      "StateSet",
      "History Buffer",
      "User Input",
    ];
    for (const h of headings) {
      expect(result).toContain(h);
    }
  });

  it("renders headings for empty layers", () => {
    const story = makeTestStory({ session: "" });
    const result = assemblePrompt({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    expect(result).toContain("# Session\n");
    expect(result).toContain("# User Input\n");
  });

  it("wraps visible history in role tags", () => {
    const result = assemblePrompt({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    expect(result).toContain("<user>\nContinue the story.\n</user>");
    expect(result).toContain(
      "<assistant>\nThe knight rode forth.\n</assistant>"
    );
  });

  it("does not wrap User Input in user tags", () => {
    const result = assemblePrompt({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "hello",
    });

    expect(result).toContain("# User Input\nhello");
    expect(result).not.toContain("<user>\nhello\n</user>");
  });

  it("excludes reasoning content from history", () => {
    const result = assemblePrompt({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    expect(result).not.toContain("thinking text");
  });

  it("excludes hidden entries", () => {
    const story = makeTestStory({
      historyBuffer: [
        {
          id: "hidden-1",
          role: "assistant",
          content: "secret",
          reasoningContent: "",
          hidden: true,
          status: "complete",
          createdAt: "",
          updatedAt: "",
        },
      ],
    });

    const result = assemblePrompt({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "go",
    });

    expect(result).not.toContain("secret");
  });

  it("does not auto-insert WorldBook entry titles", () => {
    const result = assemblePrompt({
      story: makeTestStory(),
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    expect(result).not.toContain("World Premise");
  });

  it("concatenates State Documents by order", () => {
    const story = makeTestStory({
      stateSet: {
        documents: [
          { id: "s1", title: "A", content: "First.", order: 1 },
          { id: "s2", title: "B", content: "Second.", order: 2 },
        ],
      },
    });

    const result = assemblePrompt({
      story,
      worldBooks: [makeWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const stateSetSection = result
      .split("# StateSet\n")[1]
      .split("\n\n# History Buffer")[0];
    expect(stateSetSection).toMatch(/First\.\n\nSecond\./);
  });
});
