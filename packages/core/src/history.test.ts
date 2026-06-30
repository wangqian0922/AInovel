import { describe, it, expect } from "vitest";
import { selectVisibleHistory, trimHistory } from "./history";
import type { HistoryEntry } from "./types";

function makeEntry(
  id: string,
  role: "user" | "assistant" = "user",
  hidden = false
): HistoryEntry {
  return {
    id,
    role,
    content: `content-${id}`,
    reasoningContent: "",
    hidden,
    status: "complete",
    createdAt: "",
    updatedAt: "",
  };
}

describe("selectVisibleHistory", () => {
  it("removes hidden entries", () => {
    const entries = [makeEntry("1"), makeEntry("2", "user", true)];
    expect(selectVisibleHistory(entries)).toHaveLength(1);
  });

  it("preserves stable ids", () => {
    const entries = [makeEntry("a"), makeEntry("b")];
    const result = selectVisibleHistory(entries);
    expect(result.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("trimHistory", () => {
  it("returns all entries when within limit", () => {
    const entries = [makeEntry("1"), makeEntry("2")];
    expect(trimHistory(entries, 5)).toHaveLength(2);
  });

  it("removes oldest entries when over limit", () => {
    const entries = [makeEntry("1"), makeEntry("2"), makeEntry("3")];
    const result = trimHistory(entries, 2);
    expect(result.map((e) => e.id)).toEqual(["2", "3"]);
  });

  it("does not preserve user/assistant pairs", () => {
    const entries = [makeEntry("1", "user"), makeEntry("2", "assistant")];
    const result = trimHistory(entries, 1);
    expect(result.map((e) => e.id)).toEqual(["2"]);
  });
});
