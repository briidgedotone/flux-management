"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useTechStack(clientId?: string) {
  return useQuery({
    queryKey: ["tech-stack", clientId ?? "all"],
    queryFn: () => api.get("/api/tech-stack", clientId ? { clientId } : undefined),
  });
}
