import { useState, useCallback, useEffect } from "react";
import type { HistoryEntry } from "@ai-novel/core";
import { assemblePrompt, validateProject } from "@ai-novel/core";
import { useWorkspace } from "./hooks/useWorkspace";
import { useGenerate } from "./hooks/useGenerate";
import { Sidebar } from "./components/Sidebar";
import { SessionPanel } from "./components/SessionPanel";
import { SystemInsertPromptPanel } from "./components/SystemInsertPromptPanel";
import { WorldBookPanel } from "./components/WorldBookPanel";
import { StateSetPanel } from "./components/StateSetPanel";
import { HistoryBufferPanel } from "./components/HistoryBufferPanel";
import { UserInputPanel } from "./components/UserInputPanel";
import { PromptPreviewModal } from "./components/PromptPreviewModal";
import { StateSetDrawer } from "./components/StateSetDrawer";
import { SettingsPanel } from "./components/SettingsPanel";

type EditorTab = "history" | "session" | "systemInsert" | "worldBook";

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export function App() {
  const {
    workspace,
    loading,
    activeStory,
    update,
    setActiveStory,
    addStory,
    deleteStory,
    updateStory,
  } = useWorkspace();

  const { generateState, startGeneration, cancelGeneration } = useGenerate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("history");
  const [showPreview, setShowPreview] = useState(false);
  const [showStateEditor, setShowStateEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("ainovel-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ainovel-theme", theme);
  }, [theme]);

  const handleUpdateStory = useCallback(
    (partial: Parameters<typeof updateStory>[1]) => {
      if (!activeStory) return;
      updateStory(activeStory.id, partial);
    },
    [activeStory, updateStory]
  );

  const handleHistoryUpdate = useCallback(
    (id: string, partial: Partial<HistoryEntry>) => {
      if (!activeStory) return;
      updateStory(activeStory.id, {
        historyBuffer: activeStory.historyBuffer.map((e) =>
          e.id === id ? { ...e, ...partial } : e
        ),
      });
    },
    [activeStory, updateStory]
  );

  const handleHistoryDelete = useCallback(
    (id: string) => {
      if (!activeStory) return;
      updateStory(activeStory.id, {
        historyBuffer: activeStory.historyBuffer.filter((e) => e.id !== id),
      });
    },
    [activeStory, updateStory]
  );

  const handleGenerate = useCallback(async () => {
    if (!activeStory || !workspace) return;

    const validation = validateProject(workspace);
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    const storyId = activeStory.id;
    const userInput = activeStory.userInputDraft;

    const userEntry: HistoryEntry = {
      id: generateId(),
      role: "user",
      content: userInput,
      reasoningContent: "",
      hidden: false,
      status: "complete",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    const updatedHistory =
      userInput.length > 0
        ? [...activeStory.historyBuffer, userEntry]
        : activeStory.historyBuffer;

    updateStory(storyId, {
      historyBuffer: updatedHistory,
      userInputDraft: userInput.length > 0 ? "" : activeStory.userInputDraft,
    });

    const result = await startGeneration(storyId);

    const assistantEntry: HistoryEntry = {
      id: generateId(),
      role: "assistant",
      content: result.content,
      reasoningContent: result.reasoning,
      hidden: false,
      status: result.interrupted ? "interrupted" : "complete",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    updateStory(storyId, {
      historyBuffer: [...updatedHistory, assistantEntry],
    });
  }, [activeStory, workspace, updateStory, startGeneration]);

  const displayHistory = activeStory
    ? generateState.generating
      ? [
          ...activeStory.historyBuffer,
          {
            id: "__streaming__",
            role: "assistant" as const,
            content: generateState.contentText,
            reasoningContent: generateState.reasoningText,
            hidden: false,
            status: "interrupted" as const,
            createdAt: nowISO(),
            updatedAt: nowISO(),
          },
        ]
      : activeStory.historyBuffer
    : [];

  if (loading) {
    return <div className="cute-main">加载中...</div>;
  }

  if (!workspace || !activeStory) {
    return <div className="cute-main">未加载工作区。</div>;
  }

  const lastAssistantEntry = [...activeStory.historyBuffer]
    .reverse()
    .find((e) => e.role === "assistant") ?? null;

  const preview = assemblePrompt({
    story: activeStory,
    worldBooks: workspace.worldBooks,
    historyLimit: workspace.settings.historyLimit,
    userInput: activeStory.userInputDraft,
  });

  const canGenerate =
    (activeStory.userInputDraft.length > 0 ||
      activeStory.historyBuffer.some((e) => !e.hidden)) &&
    !generateState.generating;

  return (
    <div className="cute-app">
      <Sidebar
        stories={workspace.stories}
        activeStoryId={workspace.activeStoryId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={(id) => {
          if (generateState.generating) cancelGeneration();
          setActiveStory(id);
        }}
        onAdd={addStory}
        onDelete={deleteStory}
      />

      {sidebarCollapsed && (
        <button
          className="cute-sidebar-toggle"
          onClick={() => setSidebarCollapsed(false)}
          title="展开侧栏"
        >
          &#9776;
        </button>
      )}
      <main className="cute-main">
        <div className="cute-header">
          <h1 className="cute-title">{activeStory.title}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cute-btn" onClick={() => setShowSettings(true)}>
              设置
            </button>
            <button className="cute-btn" onClick={() => setShowPreview(true)}>
              Prompt 预览
            </button>
          </div>
        </div>

        <div className="cute-tabs">
          {[
            { key: "history" as const, label: "对话" },
            { key: "session" as const, label: "会话" },
            { key: "systemInsert" as const, label: "系统提示" },
            { key: "worldBook" as const, label: "世界书" },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`cute-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <>
            <StateSetPanel
              stateSet={activeStory.stateSet}
              onOpenEditor={() => setShowStateEditor(true)}
            />

            <HistoryBufferPanel
              entries={displayHistory}
              displayLimit={workspace.settings.historyDisplayLimit}
              onUpdate={handleHistoryUpdate}
              onDelete={handleHistoryDelete}
            />

            <UserInputPanel
              value={activeStory.userInputDraft}
              onChange={(c) => handleUpdateStory({ userInputDraft: c })}
              onGenerate={handleGenerate}
              generating={generateState.generating}
              canGenerate={canGenerate}
            />
          </>
        )}
        {activeTab === "session" && (
          <SessionPanel
            content={activeStory.session}
            onChange={(c) => handleUpdateStory({ session: c })}
          />
        )}
        {activeTab === "systemInsert" && (
          <SystemInsertPromptPanel
            content={activeStory.systemInsertPrompt}
            onChange={(c) => handleUpdateStory({ systemInsertPrompt: c })}
          />
        )}
        {activeTab === "worldBook" && (
          <WorldBookPanel
            worldBooks={workspace.worldBooks}
            openWorldBookIds={activeStory.openWorldBookIds}
            onUpdateWorldBooks={(wbs) =>
              update(() => ({ ...workspace, worldBooks: wbs }))
            }
            onToggleOpen={(bookId) => {
              const ids = activeStory.openWorldBookIds;
              const next = ids.includes(bookId)
                ? ids.filter((id) => id !== bookId)
                : [...ids, bookId];
              updateStory(activeStory.id, { openWorldBookIds: next });
            }}
          />
        )}
      </main>

      {showPreview && (
        <PromptPreviewModal prompt={preview} onClose={() => setShowPreview(false)} />
      )}

      {showSettings && (
        <SettingsPanel
          theme={theme}
          onThemeChange={setTheme}
          settings={workspace.settings}
          onChange={(s) => update(() => ({ ...workspace, settings: s }))}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showStateEditor && (
        <div className="cute-overlay" onClick={() => setShowStateEditor(false)} />
      )}
      <StateSetDrawer
        open={showStateEditor}
        stateSet={activeStory.stateSet}
        recentOutput={lastAssistantEntry}
        onClose={() => setShowStateEditor(false)}
        onChange={(ss) => handleUpdateStory({ stateSet: ss })}
      />
    </div>
  );
}
