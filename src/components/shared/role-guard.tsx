"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/permissions";

interface RoleGuardProps {
  allowed: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { data: auth, isLoading } = useAuth();
  const router = useRouter();
  const role = (auth as any)?.role as Role | undefined;

  useEffect(() => {
    if (!isLoading && role && !allowed.includes(role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, role, allowed, router]);

  if (isLoading) return null;
  if (role && !allowed.includes(role)) return null;

  return <>{children}</>;
}
