"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useContactSubmissions(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: queryKeys.contactSubmissions.list(filters),
    queryFn: () => api.get("/api/contact-submissions", filters),
  });
}

export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put("/api/contact-submissions/" + id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.contactSubmissions.all }); },
  });
}
