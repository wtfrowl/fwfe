// store/eventStore.ts
import { create } from "zustand";

interface EventStore {
  tripRefreshKey: number;
  expenseRefreshKey: number;
  documentRefreshKey: number;

  // Actions
  triggerTripRefresh: () => void;
  triggerExpenseRefresh: () => void;
  triggerDocumentRefresh: () => void;

  resetAll: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
  tripRefreshKey: 0,
  expenseRefreshKey: 0,  documentRefreshKey: 0,

  triggerTripRefresh: () =>
    set((state) => ({ tripRefreshKey: state.tripRefreshKey + 1 })),

  triggerExpenseRefresh: () =>
    set((state) => ({ expenseRefreshKey: state.expenseRefreshKey + 1 })),

  triggerDocumentRefresh: () =>
    set((state) => ({ documentRefreshKey: state.documentRefreshKey + 1 })),

  resetAll: () =>
    set({
      tripRefreshKey: 0,
      expenseRefreshKey: 0,
      documentRefreshKey: 0,
    }),
}));
