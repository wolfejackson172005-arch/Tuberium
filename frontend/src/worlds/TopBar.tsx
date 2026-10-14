import { Bell, ChevronRight, Search } from "lucide-react";
import { useTheme } from "../themes/useTheme";

interface Props {
  title: string;
  running: number;
  resting: number;
  notifications: number;
}

export function TopBar({ title, running, resting, notifications }: Props) {
  const theme = useTheme();

  return (
    <header className="worlds-top">
      <div className="worlds-top__title">
        <h1>{title}</h1>
        <span className="worlds-top__summary">
          {running} running, {resting} resting
        </span>
      </div>

      <div className="worlds-top__tools">
        <label className="worlds-search">
          <Search className="icon icon--sm" />
          <input type="search" placeholder="Search worlds" aria-label="Search worlds" />
          <kbd>Ctrl K</kbd>
        </label>
        <button type="button" className="icon-button" aria-label={`Notifications, ${notifications} new`}>
          <Bell className="icon" />
          {notifications > 0 && <span className="icon-button__count">{notifications}</span>}
        </button>
        <button type="button" className="worlds-theme-pill" aria-label={`Theme: ${theme.name}`}>
          <span className="worlds-theme-pill__mark">{theme.name.charAt(0)}</span>
          {theme.name}
          <ChevronRight className="icon icon--sm" />
        </button>
      </div>
    </header>
  );
}
