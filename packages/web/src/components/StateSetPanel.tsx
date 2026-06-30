import type { StateSet } from "@ai-novel/core";

interface StateSetPanelProps {
  stateSet: StateSet;
  onOpenEditor: () => void;
}

export function StateSetPanel({ stateSet, onOpenEditor }: StateSetPanelProps) {
  const sorted = [...stateSet.documents].sort((a, b) => a.order - b.order);

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
        <h2 className="cute-section-title">StateSet</h2>
        <button className="cute-btn" onClick={onOpenEditor}>
          ✎ 管理状态
        </button>
      </div>

      {sorted.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>暂无状态文档。</p>
      )}

      {sorted.map((doc) => (
        <div
          key={doc.id}
          style={{
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-md)",
            padding: "6px 12px",
            marginBottom: 4,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="cute-badge cute-badge-user" style={{ fontSize: 11 }}>
            #{doc.order}
          </span>
          <span>{doc.title}</span>
        </div>
      ))}
    </div>
  );
}
