// Frontend API fetch wrapper — sends cookies, handles errors, auto-redirects on 401
// Credentials: include (sends flux-management-session HTTP-only cookie)

import type { ApiError } from "@/types";

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new ApiClientError("UNAUTHORIZED", "Authentication required", 401);
  }

  const json = await res.json();

  if (!res.ok) {
    const err = json.error as ApiError | undefined;
    throw new ApiClientError(
      err?.code ?? "UNKNOWN",
      err?.message ?? "Something went wrong",
      res.status,
    );
  }

  return json.data as T;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>("GET", buildUrl(path, params)),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
