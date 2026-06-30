import type { Story, WorldBook, HistoryEntry } from "./types";
import { selectVisibleHistory, trimHistory } from "./history";
import { matchKeywordEntries } from "./keyword-matching";

export interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ApiMessageInput {
  story: Story;
  worldBooks: WorldBook[];
  historyLimit: number;
  userInput: string;
}

export function buildApiMessages(input: ApiMessageInput): ApiMessage[] {
  const { story, worldBooks, historyLimit, userInput } = input;

  const visibleEntries = selectVisibleHistory(story.historyBuffer);
  const trimmedEntries = trimHistory(visibleEntries, historyLimit);

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

  const stateDocuments = [...story.stateSet.documents].sort(
    (a, b) => a.order - b.order
  );
  const stateContent = stateDocuments.map((d) => d.content).join("\n\n");

  const worldBookMessage = `# WorldBook.fixed\n${fixedContent}\n\n# WorldBook.keyword\n${keywordContent}`;

  const messages: ApiMessage[] = [
    { role: "system", content: `# Session\n${story.session}` },
    {
      role: "system",
      content: `# System Insert Prompt\n${story.systemInsertPrompt}`,
    },
    { role: "system", content: worldBookMessage },
    { role: "system", content: `# StateSet\n${stateContent}` },
  ];

  for (const entry of trimmedEntries) {
    messages.push({
      role: entry.role,
      content: entry.content,
    });
  }

  if (userInput.length > 0) {
    messages.push({ role: "user", content: userInput });
  }

  return messages;
}
