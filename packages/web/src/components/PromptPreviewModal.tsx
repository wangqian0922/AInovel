interface PromptPreviewModalProps {
  prompt: string;
  onClose: () => void;
}

export function PromptPreviewModal({
  prompt,
  onClose,
}: PromptPreviewModalProps) {
  return (
    <div className="cute-overlay" onClick={onClose}>
      <div
        className="cute-card"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "80vw",
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 className="cute-section-title">Prompt 预览</h2>
          <button className="cute-btn-icon" onClick={onClose}>
            &times;
          </button>
        </div>
        <pre
          style={{
            fontSize: 13,
            whiteSpace: "pre-wrap",
            margin: 0,
            fontFamily: "monospace",
            color: "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {prompt}
        </pre>
      </div>
    </div>
  );
}
