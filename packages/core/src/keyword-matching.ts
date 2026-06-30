import type { WorldBookKeywordEntry } from "./types";

export function parseKeywords(keywordText: string): string[] {
  return keywordText.split(/\s+/).filter((k) => k.length > 0);
}

export function matchKeywordEntries(
  entries: WorldBookKeywordEntry[],
  userInput: string
): WorldBookKeywordEntry[] {
  return entries.filter((entry) =>
    entry.keywords.some((kw) => userInput.includes(kw))
  );
}
