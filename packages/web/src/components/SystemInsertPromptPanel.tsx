import { MarkdownEditor } from "./MarkdownEditor";

interface SystemInsertPromptPanelProps {
  content: string;
  onChange: (content: string) => void;
}

export function SystemInsertPromptPanel({
  content,
  onChange,
}: SystemInsertPromptPanelProps) {
  return (
    <div className="cute-card">
      <h2 className="cute-section-title" style={{ marginBottom: 8 }}>系统提示</h2>
      <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "var(--text-secondary)" }}>
        控制输出行为的指令（字数、风格、节奏等）。
      </p>
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder="输入 System Insert Prompt 内容（Markdown）..."
      />
    </div>
  );
}
