import type { LucideIcon } from "lucide-react";
import { ChevronRight, ClipboardCheck, Globe, Palette, ScrollText, Settings, Sparkles, Users } from "lucide-react";
import { mockApprovalCount, mockSpend, mockUser } from "../mock/worlds";

const ITEMS: { id: string; label: string; icon: LucideIcon; count?: number }[] = [
  { id: "worlds", label: "Worlds", icon: Globe },
  { id: "presets", label: "Presets", icon: Sparkles },
  { id: "agents", label: "Agent Library", icon: Users },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck, count: mockApprovalCount },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

function Logo() {
  return (
    <svg className="worlds-logo" viewBox="0 0 32 32" aria-hidden="true">
      <circle className="worlds-logo__ear" cx="8" cy="9" r="5" />
      <circle className="worlds-logo__ear" cx="24" cy="9" r="5" />
      <rect className="worlds-logo__head" x="3" y="7" width="26" height="22" rx="11" />
      <rect className="worlds-logo__shades" x="8" y="15" width="16" height="5" rx="2.5" />
    </svg>
  );
}

export function Sidebar({ activeId }: { activeId: string }) {
  const spentShare = Math.min(1, mockSpend.todayUsd / mockSpend.limitUsd);

  return (
    <nav className="worlds-nav" aria-label="Main">
      <div className="worlds-nav__brand">
        <Logo />
        <span>tuberium</span>
      </div>

      <ul className="worlds-nav__list">
        {ITEMS.map(({ id, label, icon: Icon, count }) => (
          <li key={id}>
            <button
              type="button"
              className={id === activeId ? "worlds-nav__item worlds-nav__item--active" : "worlds-nav__item"}
              aria-current={id === activeId ? "page" : undefined}
            >
              <Icon className="icon" />
              <span className="worlds-nav__label">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="worlds-nav__count" aria-label={`${count} waiting`}>
                  {count}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="worlds-nav__foot">
        <div className="worlds-nav__spend">
          <div className="worlds-nav__spend-row">
            <span>Today's spend</span>
            <strong>
              ${mockSpend.todayUsd.toFixed(2)} of ${mockSpend.limitUsd}
            </strong>
          </div>
          <div className="worlds-nav__spend-track">
            <div className="worlds-nav__spend-fill" style={{ width: `${Math.round(spentShare * 100)}%` }} />
          </div>
        </div>
        <button type="button" className="worlds-nav__user">
          <span className="worlds-nav__user-avatar">{mockUser.initials}</span>
          <span className="worlds-nav__user-text">
            <strong>{mockUser.name}</strong>
            <span>{mockUser.workspace}</span>
          </span>
          <ChevronRight className="icon icon--sm" />
        </button>
      </div>
    </nav>
  );
}
