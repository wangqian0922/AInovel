import { describe, it, expect } from "vitest";
import { validateProject } from "./validation";
import { makeTestWorkspace, makeTestStory } from "./test-utils";

describe("validateProject", () => {
  it("passes a well-formed workspace", () => {
    const result = validateProject(makeTestWorkspace());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects workspace with no stories", () => {
    const ws = makeTestWorkspace({ stories: [], activeStoryId: "" });
    const result = validateProject(ws);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("at least one Story");
  });

  it("rejects workspace with missing active story", () => {
    const ws = makeTestWorkspace({ activeStoryId: "nonexistent" });
    const result = validateProject(ws);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Active Story not found");
  });

  it("rejects generation when User Input is empty and no visible history", () => {
    const story = makeTestStory({
      userInputDraft: "",
      historyBuffer: [],
    });
    const ws = makeTestWorkspace({ stories: [story] });
    const result = validateProject(ws);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Cannot generate"))).toBe(true);
  });

  it("allows generation when User Input is empty but visible history exists", () => {
    const story = makeTestStory({ userInputDraft: "" });
    const ws = makeTestWorkspace({ stories: [story] });
    const result = validateProject(ws);
    expect(result.valid).toBe(true);
  });

  it("allows generation when User Input is non-empty even without history", () => {
    const story = makeTestStory({
      userInputDraft: "write something",
      historyBuffer: [],
    });
    const ws = makeTestWorkspace({ stories: [story] });
    const result = validateProject(ws);
    expect(result.valid).toBe(true);
  });
});
