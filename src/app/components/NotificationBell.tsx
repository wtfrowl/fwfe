import { useContext, useEffect, useRef, useState } from "react";
import { BiBell } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FaCheck, FaExclamation, FaInfo, FaTimes } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { useRealtime } from "../../context/realtime";
import { useNotificationStore } from "../../store/notifications/store";
import type { AppNotification, NotificationSeverity } from "../../api/notifications.api";
import { spring, ease } from "../../motion/springs";
import { cn } from "../../utils/cn";

/**
 * Renders the notification store. It no longer owns the socket — see
 * `RealtimeContext` for why that mattered.
 */

const severityStyles: Record<NotificationSeverity, { chip: string; Icon: typeof FaInfo }> = {
  info: { chip: "bg-accent-soft text-accent-ink", Icon: FaInfo },
  success: { chip: "bg-positive-soft text-positive-ink", Icon: FaCheck },
  warning: { chip: "bg-caution-soft text-caution-ink", Icon: FaExclamation },
  critical: { chip: "bg-critical-soft text-critical-ink", Icon: FaExclamation },
};

/** "2m", "3h", "Yesterday" — an ISO string is not a time a person reads. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 45) return "Just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  if (seconds < 172800) return "Yesterday";
  if (seconds < 604800) return `${Math.round(seconds / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function NotificationRow({
  notification,
  onOpen,
  onDismiss,
}: {
  notification: AppNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const reduced = useReducedMotion();
  const style = severityStyles[notification.severity] ?? severityStyles.info;
  const Icon = style.Icon;
  const unread = !notification.readAt;

  return (
    <motion.li
      layout
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={ease.enter}
      className="group relative overflow-hidden border-b border-hairline/60 last:border-0"
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
          unread ? "bg-accent-soft/40 hover:bg-accent-soft/70" : "hover:bg-ink/4"
        )}
      >
        <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", style.chip)}>
          <Icon className="h-2.5 w-2.5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "text-sm text-ink-vibrant",
                /* Weight carries unread, not colour alone — the dot is small
                   and colour is not a signal everyone can read. */
                unread ? "font-semibold" : "font-medium"
              )}
            >
              {notification.title}
            </span>
            {unread && (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />
            )}
          </span>

          {notification.body ? (
            <span className="mt-0.5 block text-sm leading-snug text-ink-vibrant-secondary">
              {notification.body}
            </span>
          ) : null}

          <span className="mt-1 block text-xs text-ink-tertiary">
            {relativeTime(notification.createdAt)}
          </span>
        </span>
      </button>

      {/* Hidden until hover on pointer devices, always present on touch. */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-ink-tertiary opacity-0 transition-opacity hover:bg-ink/8 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
      >
        <FaTimes className="h-2.5 w-2.5" />
      </button>
    </motion.li>
  );
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { role } = useContext(AuthContext);
  const { connection } = useRealtime();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const loading = useNotificationStore((s) => s.loading);
  const loadingMore = useNotificationStore((s) => s.loadingMore);
  const nextCursor = useNotificationStore((s) => s.nextCursor);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const removeNotification = useNotificationStore((s) => s.remove);
  const loadMore = useNotificationStore((s) => s.loadMore);

  useEffect(() => {
    if (!isOpen) return;

    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  const basePath = role === "owner" ? "/owner-home" : "/driver-home";

  const openNotification = (n: AppNotification) => {
    void markRead(n._id);

    const id = n.entity?.id;
    if (id) {
      if (n.entity?.kind === "trip") navigate(`${basePath}/trips/${id}`);
      else if (n.entity?.kind === "document") navigate(`${basePath}/mydocs/documents/${id}`);
      else if (n.entity?.kind === "tyre") navigate(`${basePath}/tyre/${id}`);
    }
    setIsOpen(false);
  };

  /* Offline is worth saying out loud. The old bell looked identical whether
     the socket was live or had silently died an hour ago. */
  const offline = connection === "reconnecting" || connection === "error";

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={isOpen}
        whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
        transition={spring.snappy}
      >
        <BiBell className="h-5 w-5" />

        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[0.625rem] font-semibold tabular-nums text-white"
              initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
              transition={spring.sheet}
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>

        {offline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-caution ring-2 ring-white"
            title="Reconnecting — live updates paused"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-motion="transform"
            style={{ transformOrigin: "top right" }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
            transition={ease.enter}
            className="material-thick absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-card shadow-[var(--shadow-floating)] ring-1 ring-hairline"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline/70 bg-white/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink-vibrant">Notifications</h2>
                {unread > 0 && (
                  <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-ink">
                    {unread}
                  </span>
                )}
              </div>

              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {offline && (
              <p className="shrink-0 border-b border-caution/25 bg-caution-soft px-4 py-2 text-xs font-medium text-caution-ink">
                Reconnecting — you may not see updates right away.
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-ink/8" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-3/4 animate-pulse rounded-chip bg-ink/8" />
                        <div className="h-3 w-1/2 animate-pulse rounded-chip bg-ink/8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-ink-vibrant">You're all caught up</p>
                  <p className="mt-1 text-xs text-ink-tertiary">
                    Trip, expense and document updates will show up here.
                  </p>
                </div>
              ) : (
                <>
                  <ul>
                    <AnimatePresence initial={false}>
                      {items.map((n) => (
                        <NotificationRow
                          key={n._id}
                          notification={n}
                          onOpen={() => openNotification(n)}
                          onDismiss={() => void removeNotification(n._id)}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>

                  {nextCursor && (
                    <button
                      type="button"
                      onClick={() => void loadMore()}
                      disabled={loadingMore}
                      className="w-full border-t border-hairline/60 px-4 py-3 text-xs font-semibold text-accent hover:bg-ink/4 disabled:opacity-60"
                    >
                      {loadingMore ? "Loading…" : "Load older"}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
