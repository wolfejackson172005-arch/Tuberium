import { themes, type ThemeId } from "../themes";

interface Props {
  themeId: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  onClose: () => void;
}

export function SettingsPanel({ themeId, onThemeChange, onClose }: Props) {
  return (
    <aside className="side-panel">
      <div className="side-panel__header">
        <h2>Settings</h2>
        <button type="button" className="side-panel__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <section className="side-panel__section">
        <h3>Theme</h3>
        <p className="side-panel__muted">Themes change the look, never what a system does.</p>
        <div className="theme-list">
          {themes.map((pack) => (
            <label key={pack.id} className="theme-list__item">
              <input
                type="radio"
                name="theme"
                checked={pack.id === themeId}
                onChange={() => onThemeChange(pack.id)}
              />
              {pack.name}
            </label>
          ))}
        </div>
      </section>
    </aside>
  );
}
