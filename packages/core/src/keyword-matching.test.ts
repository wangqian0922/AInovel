import { describe, it, expect } from "vitest";
import { parseKeywords, matchKeywordEntries } from "./keyword-matching";
import type { WorldBookKeywordEntry } from "./types";

describe("parseKeywords", () => {
  it("splits whitespace-separated text into keywords", () => {
    expect(parseKeywords("castle dragon knight")).toEqual([
      "castle",
      "dragon",
      "knight",
    ]);
  });

  it("ignores empty items from multiple spaces", () => {
    expect(parseKeywords("castle   dragon")).toEqual(["castle", "dragon"]);
  });

  it("returns empty array for empty string", () => {
    expect(parseKeywords("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseKeywords("   ")).toEqual([]);
  });

  it("preserves single keyword", () => {
    expect(parseKeywords("castle")).toEqual(["castle"]);
  });
});

describe("matchKeywordEntries", () => {
  const entries: WorldBookKeywordEntry[] = [
    {
      id: "1",
      title: "Castle",
      keywordText: "castle fortress",
      keywords: ["castle", "fortress"],
      content: "Castle description",
      order: 1,
    },
    {
      id: "2",
      title: "Dragon",
      keywordText: "dragon",
      keywords: ["dragon"],
      content: "Dragon description",
      order: 2,
    },
  ];

  it("matches entry when user input contains a keyword", () => {
    const result = matchKeywordEntries(entries, "attack the castle");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("matches on any keyword in the list", () => {
    const result = matchKeywordEntries(entries, "defend the fortress");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("matches multiple entries when multiple keywords hit", () => {
    const result = matchKeywordEntries(
      entries,
      "the dragon flew over the castle"
    );
    expect(result).toHaveLength(2);
  });

  it("returns empty when no keyword matches", () => {
    const result = matchKeywordEntries(entries, "the ocean is vast");
    expect(result).toHaveLength(0);
  });

  it("uses raw substring containment", () => {
    const result = matchKeywordEntries(entries, "dragons are scary");
    expect(result).toHaveLength(1);
  });
});
