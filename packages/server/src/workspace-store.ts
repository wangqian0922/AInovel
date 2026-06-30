import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import type { Workspace } from "@ai-novel/core";
import { createDefaultWorkspace, DEFAULT_SETTINGS } from "@ai-novel/core";

const CURRENT_VERSION = 2;

interface StoredData {
  version: number;
  workspace: Workspace;
}

export interface WorkspaceStoreOptions {
  dir?: string;
  filename?: string;
}

export class WorkspaceStore {
  private filePath: string;
  private workspace: Workspace;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSave: Promise<void> | null = null;

  constructor(options?: WorkspaceStoreOptions) {
    const dir = options?.dir ?? ".";
    const filename = options?.filename ?? "workspace.json";
    this.filePath = join(dir, filename);
    this.workspace = createDefaultWorkspace();
  }

  async load(): Promise<Workspace> {
    try {
      await access(this.filePath);
      const raw = await readFile(this.filePath, "utf-8");
      const data: StoredData = JSON.parse(raw);
      this.workspace = this.migrate(data);
      return this.workspace;
    } catch {
      this.workspace = createDefaultWorkspace();
      await this.saveNow();
      return this.workspace;
    }
  }

  get(): Workspace {
    return this.workspace;
  }

  update(partial: Partial<Workspace>): Workspace {
    this.workspace = { ...this.workspace, ...partial };
    return this.workspace;
  }

  replace(workspace: Workspace): Workspace {
    this.workspace = workspace;
    return this.workspace;
  }

  save(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.pendingSave = this.saveNow();
    }, 2000);
  }

  flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.pendingSave) return this.pendingSave;
    return this.saveNow();
  }

  private async saveNow(): Promise<void> {
    const data: StoredData = {
      version: CURRENT_VERSION,
      workspace: this.workspace,
    };
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  private migrate(data: StoredData): Workspace {
    let version = data.version ?? 0;
    let ws = data.workspace;

    while (version < CURRENT_VERSION) {
      if (version === 0) {
        ws = this.migrateV0toV1(ws);
      }
      if (version === 1) {
        ws = this.migrateV1toV2(ws);
      }
      version++;
    }

    return ws;
  }

  private migrateV0toV1(ws: Workspace): Workspace {
    if (!ws.settings) {
      ws.settings = { ...DEFAULT_SETTINGS };
    }
    const raw = ws as unknown as Record<string, unknown>;
    if (!raw.worldBooks) {
      raw.worldBooks = [];
    }
    return ws;
  }

  private migrateV1toV2(ws: Workspace): Workspace {
    const raw = ws as unknown as Record<string, unknown>;
    const oldWb = raw.worldBook as
      | { fixedEntries?: unknown[]; keywordEntries?: unknown[] }
      | undefined;
    if (oldWb) {
      const fixedEntries = (oldWb.fixedEntries ?? []).map((e) => ({
        ...(e as object),
        id: (e as Record<string, string>).id ?? crypto.randomUUID(),
      })) as Workspace["worldBooks"][number]["fixedEntries"];
      const keywordEntries = (oldWb.keywordEntries ?? []).map((e) => ({
        ...(e as object),
        id: (e as Record<string, string>).id ?? crypto.randomUUID(),
      })) as Workspace["worldBooks"][number]["keywordEntries"];
      ws.worldBooks = [
        {
          id: crypto.randomUUID(),
          name: "默认世界书",
          fixedEntries,
          keywordEntries,
        },
      ];
      delete raw.worldBook;
    }

    for (const story of ws.stories) {
      const rawStory = story as unknown as Record<string, unknown>;
      const oldIds = rawStory.openWorldBookEntryIds as string[] | undefined;
      if (oldIds !== undefined) {
        story.openWorldBookIds =
          oldIds.length > 0 && ws.worldBooks.length > 0
            ? ws.worldBooks.map((wb) => wb.id)
            : [];
        delete rawStory.openWorldBookEntryIds;
      }
    }
    return ws;
  }
}
