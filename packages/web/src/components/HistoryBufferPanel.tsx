import { useState } from "react";
import type { HistoryEntry } from "@ai-novel/core";
import { MarkdownEditor } from "./MarkdownEditor";

interface HistoryBufferPanelProps {
  entries: HistoryEntry[];
  displayLimit: number;
  onUpdate: (id: string, partial: Partial<HistoryEntry>) => void;
  onDelete: (id: string) => void;
}

export function HistoryBufferPanel({
  entries,
  displayLimit,
  onUpdate,
  onDelete,
}: HistoryBufferPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? entries : entries.slice(-displayLimit);

  return (
    <div className="cute-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h2 className="cute-section-title">历史记录</h2>
        {entries.length > displayLimit && (
          <button className="cute-btn-sm" onClick={() => setShowAll(!showAll)}>
            {showAll
              ? `显示最近 ${displayLimit} 条`
              : `全部 (${entries.length} 条)`}
          </button>
        )}
      </div>

      {visible.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          暂无历史记录。生成的输出将显示在这里。
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((entry) => (
          <HistoryEntryCard
            key={entry.id}
            entry={entry}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  onUpdate: (id: string, partial: Partial<HistoryEntry>) => void;
  onDelete: (id: string) => void;
}

function HistoryEntryCard({ entry, onUpdate, onDelete }: HistoryEntryCardProps) {
  const [editing, setEditing] = useState(false);

  const roleBadge =
    entry.role === "user" ? "cute-badge-user" : "cute-badge-assistant";
  const roleLabel = entry.role === "user" ? "用户" : "助理";

  return (
    <div
      className="cute-history-entry"
      style={{ opacity: entry.hidden ? 0.5 : 1 }}
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 6,
          alignItems: "center",
        }}
      >
        <span className={`cute-badge ${roleBadge}`}>
          {roleLabel}
          {entry.status === "interrupted" && (
            <span className="cute-badge-interrupted" style={{ marginLeft: 4, padding: "0 4px", borderRadius: 8, fontSize: 11 }}>
              中断
            </span>
          )}
        </span>

        <label style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            className="cute-checkbox"
            checked={entry.hidden}
            onChange={() => onUpdate(entry.id, { hidden: !entry.hidden })}
          />
          隐藏
        </label>

        <button className="cute-btn-sm" onClick={() => setEditing(!editing)}>
          {editing ? "完成" : "编辑"}
        </button>

        <button className="cute-btn-icon" onClick={() => onDelete(entry.id)} title="删除">
          &times;
        </button>
      </div>

      {entry.role === "assistant" && entry.reasoningContent && (
        <div className="cute-thinking" style={{ marginBottom: 6 }}>
          {entry.reasoningContent}
        </div>
      )}

      {editing ? (
        <MarkdownEditor
          value={entry.content}
          onChange={(c) => onUpdate(entry.id, { content: c })}
          minRows={3}
        />
      ) : (
        <pre
          style={{
            fontSize: 13,
            whiteSpace: "pre-wrap",
            margin: 0,
            fontFamily: "inherit",
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {entry.content}
        </pre>
      )}
    </div>
  );
}
