// React Query config and key factory — management portal domains

import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export const queryKeys = {
  auth: ["auth"] as const,
  dashboard: ["dashboard"] as const,
  clients: {
    all: ["clients"] as const,
    list: (filters: object) => ["clients", "list", filters] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
    stats: (id: string, range: string) => ["clients", "stats", id, range] as const,
  },
  tickets: {
    all: ["tickets"] as const,
    list: (filters: object) => ["tickets", "list", filters] as const,
    detail: (id: string) => ["tickets", "detail", id] as const,
    stats: (filters: object) => ["tickets", "stats", filters] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters: object) => ["projects", "list", filters] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    stats: (filters: object) => ["projects", "stats", filters] as const,
  },
  team: {
    all: ["team"] as const,
    detail: (id: string) => ["team", "detail", id] as const,
  },
  reports: {
    revenue: (range: string) => ["reports", "revenue", range] as const,
    teamPerformance: (range: string) => ["reports", "team-performance", range] as const,
    sla: (range: string) => ["reports", "sla", range] as const,
    ticketAnalytics: (filters: object) => ["reports", "ticket-analytics", filters] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  connectors: ["connectors"] as const,
  ai: {
    conversations: ["ai", "conversations"] as const,
    conversation: (id: string) => ["ai", "conversations", id] as const,
  },
  contactSubmissions: {
    all: ["contact-submissions"] as const,
    list: (filters: object) => ["contact-submissions", "list", filters] as const,
  },
};
