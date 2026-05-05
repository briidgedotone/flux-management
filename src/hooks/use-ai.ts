"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.ai.conversations,
    queryFn: () => api.get("/api/ai/conversations"),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.ai.conversation(id),
    queryFn: () => api.get("/api/ai/conversations/" + id),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { conversationId?: string | null; message: string }) =>
      api.post("/api/ai/chat", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.ai.conversations }); },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete("/api/ai/conversations/" + id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.ai.conversations }); },
  });
}
