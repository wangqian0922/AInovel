import type { HistoryEntry } from "./types";

export function selectVisibleHistory(
  entries: HistoryEntry[]
): HistoryEntry[] {
  return entries.filter((e) => !e.hidden);
}

export function trimHistory(
  entries: HistoryEntry[],
  limit: number
): HistoryEntry[] {
  if (entries.length <= limit) return entries;
  return entries.slice(entries.length - limit);
}
