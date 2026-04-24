"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-client";

interface AuthMe {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  return useQuery({
    queryKey: queryKeys.auth,
    queryFn: () => api.get<AuthMe>("/api/auth/me"),
  });
}
