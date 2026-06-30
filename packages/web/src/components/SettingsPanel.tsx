import type { Settings } from "@ai-novel/core";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onClose,
}: SettingsPanelProps) {
  const update = (partial: Partial<Settings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div
      className="cute-drawer"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        display: "flex",
        flexDirection: "column",
        zIndex: 60,
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 className="cute-section-title">设置</h2>
        <button className="cute-btn-icon" onClick={onClose}>
          &times;
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            DeepSeek API Key
          </div>
          <input
            className="cute-input"
            type="password"
            value={settings.deepSeekApiKey}
            onChange={(e) => update({ deepSeekApiKey: e.target.value })}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            模型
          </div>
          <select
            className="cute-input"
            value={settings.model}
            onChange={(e) => update({ model: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="deepseek-chat">deepseek-chat</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            API 地址
          </div>
          <input
            className="cute-input"
            value={settings.deepSeekBaseUrl}
            onChange={(e) => update({ deepSeekBaseUrl: e.target.value })}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            推理努力程度
          </div>
          <select
            className="cute-input"
            value={settings.reasoningEffort}
            onChange={(e) => update({ reasoningEffort: e.target.value })}
            style={{ width: "100%" }}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </label>

        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            历史记录上限
          </div>
          <input
            className="cute-input"
            type="number"
            value={settings.historyLimit}
            onChange={(e) => update({ historyLimit: parseInt(e.target.value) || 200 })}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          <div style={{ fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
            显示上限
          </div>
          <input
            className="cute-input"
            type="number"
            value={settings.historyDisplayLimit}
            onChange={(e) =>
              update({ historyDisplayLimit: parseInt(e.target.value) || 200 })
            }
            style={{ width: "100%" }}
          />
        </label>
      </div>
    </div>
  );
}
