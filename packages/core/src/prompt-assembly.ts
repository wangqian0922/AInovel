import type { Story, WorldBook, StateDocument, HistoryEntry } from "./types";
import { selectVisibleHistory, trimHistory } from "./history";
import { matchKeywordEntries } from "./keyword-matching";

export interface PromptAssemblyInput {
  story: Story;
  worldBooks: WorldBook[];
  historyLimit: number;
  userInput: string;
}

function layerHeading(name: string): string {
  return `# ${name}`;
}

function serializeHistoryRole(entry: HistoryEntry): string {
  const tag = entry.role === "user" ? "user" : "assistant";
  return `<${tag}>\n${entry.content}\n</${tag}>`;
}

export function assemblePrompt(input: PromptAssemblyInput): string {
  const { story, worldBooks, historyLimit, userInput } = input;

  const visibleEntries = selectVisibleHistory(story.historyBuffer);
  const trimmedEntries = trimHistory(visibleEntries, historyLimit);

  // Collect entries from all open WorldBooks
  const openBooks = worldBooks.filter((wb) =>
    story.openWorldBookIds.includes(wb.id)
  );

  const fixedContent = openBooks
    .flatMap((wb) => wb.fixedEntries)
    .sort((a, b) => a.order - b.order)
    .map((e) => e.content)
    .join("\n\n");

  const matchedKeywordEntries = matchKeywordEntries(
    openBooks.flatMap((wb) => wb.keywordEntries),
    userInput
  );

  const keywordContent = matchedKeywordEntries
    .sort((a, b) => a.order - b.order)
    .map((e) => e.content)
    .join("\n\n");

  const stateDocuments: StateDocument[] = [...story.stateSet.documents].sort(
    (a, b) => a.order - b.order
  );

  const stateContent = stateDocuments.map((d) => d.content).join("\n\n");

  const historyBlock = trimmedEntries.map(serializeHistoryRole).join("\n\n");

  const layers: { heading: string; content: string }[] = [
    { heading: layerHeading("Session"), content: story.session },
    {
      heading: layerHeading("System Insert Prompt"),
      content: story.systemInsertPrompt,
    },
    { heading: layerHeading("WorldBook.fixed"), content: fixedContent },
    { heading: layerHeading("WorldBook.keyword"), content: keywordContent },
    { heading: layerHeading("StateSet"), content: stateContent },
    { heading: layerHeading("History Buffer"), content: historyBlock },
    { heading: layerHeading("User Input"), content: userInput },
  ];

  return layers.map((l) => `${l.heading}\n${l.content}`).join("\n\n");
}
