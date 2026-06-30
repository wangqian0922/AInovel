import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile, unlink, access } from "node:fs/promises";
import { join } from "node:path";
import { mkdtemp } from "node:fs";
import { tmpdir } from "node:os";
import { WorkspaceStore } from "./workspace-store";
import type { Workspace } from "@ai-novel/core";

function tempDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    mkdtemp(join(tmpdir(), "ws-test-"), (err, dir) => {
      if (err) reject(err);
      else resolve(dir);
    });
  });
}

describe("WorkspaceStore", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await tempDir();
  });

  afterEach(async () => {
    try {
      await unlink(join(dir, "workspace.json"));
    } catch {}
  });

  it("creates default workspace.json on first load", async () => {
    const store = new WorkspaceStore({ dir });
    const ws = await store.load();

    expect(ws.name).toBe("我的工作区");
    expect(ws.stories).toHaveLength(1);
    expect(ws.stories[0].title).toBe("我的故事");

    const exists = await access(join(dir, "workspace.json")).then(
      () => true,
      () => false
    );
    expect(exists).toBe(true);
  });

  it("persists and reloads workspace", async () => {
    const store1 = new WorkspaceStore({ dir });
    await store1.load();

    const ws = store1.get();
    ws.name = "更新的工作区";
    store1.replace(ws);
    await store1.flush();

    const store2 = new WorkspaceStore({ dir });
    const reloaded = await store2.load();
    expect(reloaded.name).toBe("更新的工作区");
  });

  it("updates workspace via partial update and save", async () => {
    const store = new WorkspaceStore({ dir });
    await store.load();

    store.update({ name: "Partial Update" });
    await store.flush();

    const raw = await readFile(join(dir, "workspace.json"), "utf-8");
    const data = JSON.parse(raw);
    expect(data.workspace.name).toBe("Partial Update");
  });

  it("saves workspace.json with version field", async () => {
    const store = new WorkspaceStore({ dir });
    await store.load();
    await store.flush();

    const raw = await readFile(join(dir, "workspace.json"), "utf-8");
    const data = JSON.parse(raw);
    expect(data.version).toBe(2);
    expect(data.workspace).toBeDefined();
  });

  it("loads existing workspace.json", async () => {
    const store1 = new WorkspaceStore({ dir });
    const ws1 = await store1.load();
    ws1.name = "Persisted";
    store1.replace(ws1);
    await store1.flush();

    const store2 = new WorkspaceStore({ dir });
    const ws2 = await store2.load();
    expect(ws2.name).toBe("Persisted");
    expect(ws2.stories).toHaveLength(1);
  });
});
