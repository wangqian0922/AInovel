interface UserInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
}

import { MarkdownEditor } from "./MarkdownEditor";

export function UserInputPanel({
  value,
  onChange,
  onGenerate,
  generating,
  canGenerate,
}: UserInputPanelProps) {
  return (
    <div className="cute-card">
      <h2 className="cute-section-title" style={{ marginBottom: 8 }}>用户输入</h2>
      <MarkdownEditor
        value={value}
        onChange={onChange}
        minRows={4}
        placeholder="输入生成指令..."
      />
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          className="cute-btn-generate"
          onClick={onGenerate}
          disabled={!canGenerate || generating}
        >
          {generating ? "✨ 生成中..." : "✨ 生成"}
        </button>
        {!canGenerate && !generating && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            请填写输入或确保有可见历史记录
          </span>
        )}
      </div>
    </div>
  );
}
