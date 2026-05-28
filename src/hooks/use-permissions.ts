"use client";

import { useAuth } from "./use-auth";
import { getPermissions, type Permissions } from "@/lib/permissions";

export function usePermissions(): Permissions {
  const { data: auth } = useAuth();
  return getPermissions((auth as any)?.role ?? "employee");
}
