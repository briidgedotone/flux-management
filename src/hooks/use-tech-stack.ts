"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useTechStack(clientId?: string) {
  return useQuery({
    queryKey: ["tech-stack", clientId ?? "all"],
    queryFn: () => api.get("/api/tech-stack", clientId ? { clientId } : undefined),
  });
}

export function useCreateSoftware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { organizationId: string; name: string; licenseCount?: number; costPerMonth?: number; billingCycle?: string; renewalDate?: string; status?: string; adminContact?: string }) =>
      api.post("/api/tech-stack/software", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-stack"] }),
  });
}

export function useDeleteSoftware() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tech-stack/software?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-stack"] }),
  });
}

export function useCreateCloud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { organizationId: string; name: string; provider?: string; tier?: string; status?: string }) =>
      api.post("/api/tech-stack/cloud", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-stack"] }),
  });
}

export function useDeleteCloud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tech-stack/cloud?id=${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-stack"] }),
  });
}
