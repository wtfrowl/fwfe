import api from "./axios";

export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface AppNotification {
  _id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  entity?: { kind?: string; id?: string };
  actor?: { id?: string; role?: "owner" | "driver" | "system"; name?: string };
  readAt: string | null;
  createdAt: string;
}

interface ListResponse {
  notifications: AppNotification[];
  unread: number;
  nextCursor: string | null;
}

export const NotificationsAPI = {
  list: (params?: { cursor?: string | null; limit?: number; unreadOnly?: boolean }) =>
    api.get("/api/notifications", {
      params: {
        limit: params?.limit ?? 20,
        ...(params?.cursor ? { cursor: params.cursor } : {}),
        ...(params?.unreadOnly ? { unreadOnly: "true" } : {}),
      },
    }) as unknown as Promise<ListResponse>,

  unreadCount: () =>
    api.get("/api/notifications/unread-count") as unknown as Promise<{ unread: number }>,

  markRead: (id: string) =>
    api.patch(`/api/notifications/${id}/read`) as unknown as Promise<{ unread: number }>,

  markAllRead: () =>
    api.patch("/api/notifications/read-all") as unknown as Promise<{ unread: number }>,

  remove: (id: string) =>
    api.delete(`/api/notifications/${id}`) as unknown as Promise<{ unread: number }>,
};
