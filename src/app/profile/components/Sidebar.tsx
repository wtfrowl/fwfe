import { useId } from "react";
import { FiUser, FiLock, FiRadio, FiBell } from "react-icons/fi";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../../motion/springs";
import { cn } from "../../../utils/cn";

export type ProfileTab = "profile" | "password" | "notifications" | "shift";

interface SidebarProps {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  showShift?: boolean;
}

/**
 * The "Notifications" and "Verification" tabs both rendered the same
 * unstyled driver-tracking debug panel and nothing else, so two of the four
 * tabs led nowhere. They are replaced by one honest "Shift" tab, shown only
 * to drivers, who are the only people it applies to.
 */
export function Sidebar({ activeTab, setActiveTab, showShift = false }: SidebarProps) {
  const reduced = useReducedMotion();
  const layoutId = `profile-tab-${useId()}`;

  const tabs = [
    { id: "profile" as const, icon: FiUser, label: "Profile" },
    { id: "password" as const, icon: FiLock, label: "Password" },
    /* Applies to everyone: an owner wants expiry and approval alerts on their
       phone as much as a driver wants trip alerts on theirs. */
    { id: "notifications" as const, icon: FiBell, label: "Notifications" },
    ...(showShift ? [{ id: "shift" as const, icon: FiRadio, label: "Shift" }] : []),
  ];

  return (
    <nav
      className="scrollbar-hide flex gap-1 overflow-x-auto rounded-card bg-ink/10 p-1.5 md:w-56 md:shrink-0 md:flex-col md:gap-0.5"
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2.5 rounded-control px-3 py-2.5",
              "text-sm font-semibold whitespace-nowrap transition-colors duration-150 md:w-full",
              active ? "text-ink" : "text-ink-tertiary hover:text-ink-secondary"
            )}
            whileTap={reduced ? { opacity: 0.7 } : { scale: 0.98 }}
            transition={spring.snappy}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-control bg-surface shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
                transition={spring.move}
              />
            )}
            <tab.icon className="h-4 w-4 shrink-0" />
            {tab.label}
          </motion.button>
        );
      })}
    </nav>
  );
}
