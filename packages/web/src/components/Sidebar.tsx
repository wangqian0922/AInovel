import { useState } from "react";
import type { Story } from "@ai-novel/core";
import { createDefaultStory } from "@ai-novel/core";

interface SidebarProps {
  stories: Story[];
  activeStoryId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (id: string) => void;
  onAdd: (story: Story) => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  stories,
  activeStoryId,
  collapsed,
  onToggleCollapse,
  onSelect,
  onAdd,
  onDelete,
}: SidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (collapsed) {
    return (
      <aside
        className="cute-sidebar"
        style={{
          width: 36,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button className="cute-sidebar-btn" onClick={onToggleCollapse} title="展开侧栏">
          &raquo;
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="cute-sidebar"
      style={{
        width: 200,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>故事列表</strong>
        <div style={{ display: "flex", gap: 2 }}>
          <button className="cute-sidebar-btn" onClick={onToggleCollapse} title="收起侧栏">
            &laquo;
          </button>
          <button className="cute-sidebar-btn" onClick={() => onAdd(createDefaultStory())} title="新建故事">
            +
          </button>
        </div>
      </div>

      {stories.map((story) => (
        <div
          key={story.id}
          className={`cute-story-item${story.id === activeStoryId ? " active" : ""}`}
          onClick={() => onSelect(story.id)}
        >
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
            {story.title}
          </span>
          {confirmDelete === story.id ? (
            <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button
                className="cute-confirm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(story.id);
                  setConfirmDelete(null);
                }}
              >
                确认
              </button>
              <button
                className="cute-btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(null);
                }}
              >
                x
              </button>
            </span>
          ) : (
            <button
              className="cute-btn-icon del-btn"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(story.id);
              }}
              title="删除故事"
            >
              &times;
            </button>
          )}
        </div>
      ))}
    </aside>
  );
}
