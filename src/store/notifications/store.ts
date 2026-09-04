import { create } from "zustand";
import { NotificationsAPI, type AppNotification } from "../../api/notifications.api";

/**
 * Notifications live in the database and are *mirrored* here.
 *
 * Previously the list existed only in this browser tab's memory: a refresh
 * emptied it, a second tab had its own, and anything that arrived while the
 * user was away was lost. The server is now the source of truth, the socket
 * is just the fast path, and this store reconciles the two.
 */

interface NotificationState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  nextCursor: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  loadMore: () => Promise<void>;
  receive: (notification: AppNotification) => void;
  setUnread: (unread: number) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

/** Cap what we hold in memory; older rows stay reachable through the API. */
const MAX_ITEMS = 200;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  loadingMore: false,
  error: null,
  nextCursor: null,
  hydrated: false,

  hydrate: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await NotificationsAPI.list();
      set({
        items: res.notifications ?? [],
        unread: res.unread ?? 0,
        nextCursor: res.nextCursor ?? null,
        hydrated: true,
      });
    } catch (err) {
      console.error("Failed to load notifications:", err);
      set({ error: "Couldn't load your notifications." });
    } finally {
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { nextCursor, loadingMore, items } = get();
    if (!nextCursor || loadingMore) return;

    set({ loadingMore: true });
    try {
      const res = await NotificationsAPI.list({ cursor: nextCursor });
      /* De-duplicate on merge: a notification arriving over the socket while
         a page request is in flight would otherwise appear twice. */
      const seen = new Set(items.map((i) => i._id));
      const merged = [...items, ...(res.notifications ?? []).filter((n) => !seen.has(n._id))];
      set({ items: merged, nextCursor: res.nextCursor ?? null, unread: res.unread ?? get().unread });
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      set({ loadingMore: false });
    }
  },

  receive: (notification) => {
    const { items } = get();
    if (items.some((i) => i._id === notification._id)) return;

    set({
      items: [notification, ...items].slice(0, MAX_ITEMS),
      unread: get().unread + (notification.readAt ? 0 : 1),
    });
  },

  /* The server is authoritative on the count — another tab or device may
     have read something. */
  setUnread: (unread) => set({ unread }),

  markRead: async (id) => {
    const target = get().items.find((i) => i._id === id);
    if (!target || target.readAt) return;

    const readAt = new Date().toISOString();
    // Optimistic: marking read should never feel like it needs a round trip.
    set({
      items: get().items.map((i) => (i._id === id ? { ...i, readAt } : i)),
      unread: Math.max(0, get().unread - 1),
    });

    try {
      const res = await NotificationsAPI.markRead(id);
      set({ unread: res.unread });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      set({
        items: get().items.map((i) => (i._id === id ? { ...i, readAt: null } : i)),
        unread: get().unread + 1,
      });
    }
  },

  markAllRead: async () => {
    const previous = get().items;
    const previousUnread = get().unread;
    if (previousUnread === 0) return;

    const readAt = new Date().toISOString();
    set({
      items: previous.map((i) => (i.readAt ? i : { ...i, readAt })),
      unread: 0,
    });

    try {
      await NotificationsAPI.markAllRead();
    } catch (err) {
      console.error("Failed to mark all read:", err);
      set({ items: previous, unread: previousUnread });
    }
  },

  remove: async (id) => {
    const previous = get().items;
    const target = previous.find((i) => i._id === id);
    set({
      items: previous.filter((i) => i._id !== id),
      unread: target && !target.readAt ? Math.max(0, get().unread - 1) : get().unread,
    });

    try {
      const res = await NotificationsAPI.remove(id);
      set({ unread: res.unread });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      set({ items: previous });
    }
  },

  reset: () =>
    set({
      items: [],
      unread: 0,
      nextCursor: null,
      hydrated: false,
      error: null,
      loading: false,
      loadingMore: false,
    }),
}));
