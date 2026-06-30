import { describe, it, expect } from "vitest";
import { assemblePrompt } from "./prompt-assembly";
import { buildApiMessages } from "./api-messages";
import { makeTestStory, makeTestWorldBook } from "./test-utils";

describe("golden: assemblePrompt", () => {
  it("produces full prompt with all layers", () => {
    const story = makeTestStory();
    const worldBook = makeTestWorldBook();
    const userInput = "describe the dragon's lair";

    const result = assemblePrompt({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput,
    });

    expect(result).toBe(`# Session
## Charter
Epic fantasy tale.

# System Insert Prompt
Write in third person past tense.

# WorldBook.fixed
A realm of ancient magic where kingdoms vie for control of the Crystal Throne.

Magic is drawn from elemental crystals. Each crystal attunes to one element: fire, water, earth, or air.

# WorldBook.keyword
Dragons are ancient elemental beings. Each dragon is bound to a specific crystal element.

# StateSet
Location: Castle.
Time: Morning.

Hero: Sir Aldric.

# History Buffer
<user>
Continue the story.
</user>

<assistant>
The knight rode forth into the mist.
</assistant>

# User Input
describe the dragon's lair`);
  });

  it("produces prompt with empty keyword section when no match", () => {
    const story = makeTestStory();
    const worldBook = makeTestWorldBook();
    const userInput = "the ocean is calm";

    const result = assemblePrompt({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput,
    });

    expect(result).toContain("# WorldBook.keyword\n");
    expect(result).not.toContain("Castle Aldric");
    expect(result).not.toContain("Dragons are ancient");
  });

  it("renders empty layer headings", () => {
    const story = makeTestStory({ session: "", systemInsertPrompt: "" });
    const worldBook = makeTestWorldBook({
      fixedEntries: [],
      keywordEntries: [],
    });

    const result = assemblePrompt({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput: "",
    });

    expect(result).toContain("# Session\n");
    expect(result).toContain("# System Insert Prompt\n");
    expect(result).toContain("# WorldBook.fixed\n");
    expect(result).toContain("# WorldBook.keyword\n");
  });
});

describe("golden: buildApiMessages", () => {
  it("produces correct message structure with non-empty user input", () => {
    const story = makeTestStory();
    const worldBook = makeTestWorldBook();

    const messages = buildApiMessages({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput: "describe the castle",
    });

    expect(messages).toHaveLength(7);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("# Session");
    expect(messages[1].role).toBe("system");
    expect(messages[1].content).toContain("# System Insert Prompt");
    expect(messages[2].role).toBe("system");
    expect(messages[2].content).toContain("# WorldBook.fixed");
    expect(messages[2].content).toContain("# WorldBook.keyword");
    expect(messages[3].role).toBe("system");
    expect(messages[3].content).toContain("# StateSet");
    expect(messages[4].role).toBe("user");
    expect(messages[4].content).toBe("Continue the story.");
    expect(messages[5].role).toBe("assistant");
    expect(messages[5].content).toBe(
      "The knight rode forth into the mist."
    );
    expect(messages[6].role).toBe("user");
    expect(messages[6].content).toBe("describe the castle");
  });

  it("omits final user message when User Input is empty", () => {
    const story = makeTestStory();
    const worldBook = makeTestWorldBook();

    const messages = buildApiMessages({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput: "",
    });

    expect(messages).toHaveLength(6);
    const last = messages[messages.length - 1];
    expect(last.role).not.toBe("user");
  });

  it("excludes reasoning content from history entries", () => {
    const story = makeTestStory();
    const worldBook = makeTestWorldBook();

    const messages = buildApiMessages({
      story,
      worldBooks: [worldBook],
      historyLimit: 200,
      userInput: "go",
    });

    const assistantMessages = messages.filter((m) => m.role === "assistant");
    for (const msg of assistantMessages) {
      expect(msg.content).not.toContain("thought");
    }
  });

  it("excludes hidden entries from messages", () => {
    const story = makeTestStory({
      historyBuffer: [
        {
          id: "hide-1",
          role: "user",
          content: "SHOULD NOT APPEAR",
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
      worldBooks: [makeTestWorldBook()],
      historyLimit: 200,
      userInput: "",
    });

    const allContent = messages.map((m) => m.content).join(" ");
    expect(allContent).not.toContain("SHOULD NOT APPEAR");
  });
});
