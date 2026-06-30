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
  if (collapsed) return null;

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
          <button
            className="cute-btn-icon del-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(story.id);
            }}
            title="删除故事"
          >
            &times;
          </button>
        </div>
      ))}
    </aside>
  );
}
