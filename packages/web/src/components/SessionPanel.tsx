import { MarkdownEditor } from "./MarkdownEditor";

interface SessionPanelProps {
  content: string;
  onChange: (content: string) => void;
}

export function SessionPanel({ content, onChange }: SessionPanelProps) {
  return (
    <div className="cute-card">
      <h2 className="cute-section-title" style={{ marginBottom: 8 }}>会话</h2>
      <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "var(--text-secondary)" }}>
        故事纲领和最高优先级约束。
      </p>
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder="输入 Session 内容（Markdown）..."
      />
    </div>
  );
}
