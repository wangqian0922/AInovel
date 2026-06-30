interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  minRows = 5,
  placeholder,
}: MarkdownEditorProps) {
  return (
    <textarea
      className="cute-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      placeholder={placeholder}
      style={{ width: "100%" }}
    />
  );
}
