import { useState } from "react";
import type { StateSet, StateDocument, HistoryEntry } from "@ai-novel/core";
import { MarkdownEditor } from "./MarkdownEditor";

interface StateSetDrawerProps {
  open: boolean;
  stateSet: StateSet;
  recentOutput: HistoryEntry | null;
  onClose: () => void;
  onChange: (ss: StateSet) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function StateSetDrawer({
  open,
  stateSet,
  recentOutput,
  onClose,
  onChange,
}: StateSetDrawerProps) {
  const [editDocId, setEditDocId] = useState<string | null>(
    stateSet.documents[0]?.id ?? null
  );

  const addDoc = () => {
    const doc: StateDocument = {
      id: generateId(),
      title: "新文档",
      content: "",
      order: stateSet.documents.length + 1,
    };
    onChange({ documents: [...stateSet.documents, doc] });
    setEditDocId(doc.id);
  };

  const updateDoc = (id: string, partial: Partial<StateDocument>) => {
    onChange({
      documents: stateSet.documents.map((d) =>
        d.id === id ? { ...d, ...partial } : d
      ),
    });
  };

  const deleteDoc = (id: string) => {
    const remaining = stateSet.documents.filter((d) => d.id !== id);
    if (remaining.length === 0) {
      const defaultDoc: StateDocument = {
        id: generateId(),
        title: "状态",
        content: "## 当前状况\n故事尚未开始。",
        order: 1,
      };
      onChange({ documents: [defaultDoc] });
    } else {
      onChange({ documents: remaining });
    }
    if (editDocId === id) setEditDocId(null);
  };

  const sorted = [...stateSet.documents].sort((a, b) => a.order - b.order);
  const activeDoc = sorted.find((d) => d.id === editDocId) ?? sorted[0];

  return (
    <div
      className={`cute-drawer cute-drawer-state${open ? " open" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <h2 className="cute-section-title">StateSet 编辑器</h2>
        <button className="cute-btn-icon" onClick={onClose}>
          &times;
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            width: 180,
            borderRight: "1px solid var(--border-soft)",
            padding: 8,
            overflowY: "auto",
            background: "var(--cream)",
          }}
        >
          {sorted.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                background: doc.id === activeDoc?.id ? "var(--bg-card)" : "transparent",
                borderRadius: "var(--radius-md)",
                marginBottom: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: doc.id === activeDoc?.id ? "var(--shadow-soft)" : undefined,
              }}
              onClick={() => setEditDocId(doc.id)}
            >
              <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                {doc.title}
              </span>
              <button
                className="cute-btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDoc(doc.id);
                }}
              >
                &times;
              </button>
            </div>
          ))}
          <button className="cute-btn-sm" onClick={addDoc} style={{ marginTop: 6, width: "100%" }}>
            + 添加文档
          </button>
        </div>

        <div
          style={{
            flex: 1,
            padding: 12,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {activeDoc && (
            <>
              <input
                className="cute-input"
                value={activeDoc.title}
                onChange={(e) => updateDoc(activeDoc.id, { title: e.target.value })}
                style={{ width: "100%" }}
              />
              <MarkdownEditor
                value={activeDoc.content}
                onChange={(c) => updateDoc(activeDoc.id, { content: c })}
                minRows={12}
                placeholder="当前状态（Markdown）..."
              />
            </>
          )}

          {recentOutput && (
            <div
              style={{
                borderTop: "1px solid var(--border-soft)",
                paddingTop: 12,
              }}
            >
              <h3 style={{ fontSize: 14, margin: "0 0 6px 0", color: "var(--text-secondary)" }}>
                最近输出
              </h3>
              <div
                className="cute-thinking"
                style={{ maxHeight: 200, overflowY: "auto" }}
              >
                {recentOutput.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
