"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useTeam() {
  return useQuery({
    queryKey: queryKeys.team.all,
    queryFn: () => api.get("/api/team"),
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: queryKeys.team.detail(id),
    queryFn: () => api.get("/api/team/" + id),
    enabled: !!id,
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put("/api/team/" + id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.team.all }); },
  });
}
