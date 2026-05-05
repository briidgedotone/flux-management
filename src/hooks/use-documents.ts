"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useDocuments(filters?: { clientId?: string; search?: string; fileType?: string }) {
  const params: Record<string, string> = {};
  if (filters?.clientId) params.clientId = filters.clientId;
  if (filters?.search) params.search = filters.search;
  if (filters?.fileType) params.fileType = filters.fileType;

  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => api.get("/api/documents", Object.keys(params).length > 0 ? params : undefined),
  });
}
