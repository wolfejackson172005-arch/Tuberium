export type View = "home" | "settings";

const ITEMS: { id: string; label: string; icon: string; view?: View }[] = [
  { id: "home", label: "Home", icon: "🏠", view: "home" },
  { id: "agents", label: "Agents", icon: "👥" },
  { id: "tasks", label: "Tasks", icon: "📋" },
  { id: "logs", label: "Logs", icon: "📜" },
  { id: "settings", label: "Settings", icon: "⚙️", view: "settings" },
];

export function Sidebar({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <nav className="sidebar">
      {ITEMS.map((item) => {
        const target = item.view;
        return (
          <button
            key={item.id}
            type="button"
            className={target === view ? "sidebar__item sidebar__item--active" : "sidebar__item"}
            disabled={target === undefined}
            title={target === undefined ? "Coming in a later milestone" : undefined}
            onClick={() => target && onView(target)}
          >
            <span className="sidebar__icon">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
