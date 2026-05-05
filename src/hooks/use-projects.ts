"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useProjects(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => api.get("/api/projects", filters),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => api.get("/api/projects/" + id),
    enabled: !!id,
  });
}

export function useProjectStats(filters: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.projects.stats(filters),
    queryFn: () => api.get("/api/projects/stats", filters),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Record<string, unknown> }) =>
      api.post("/api/projects/" + projectId + "/tasks", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.projects.all }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, taskId, data }: { projectId: string; taskId: string; data: Record<string, unknown> }) =>
      api.put("/api/projects/" + projectId + "/tasks/" + taskId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.projects.all }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      api.delete("/api/projects/" + projectId + "/tasks/" + taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.projects.all }); },
  });
}
