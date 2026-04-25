"use client";

import {
  UsersThreeIcon,
  EnvelopeIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useTeam } from "@/hooks/use-team";
import type { TeamMember } from "@/data/types";

const roleBadge: Record<string, string> = {
  "co-ceo": "bg-blue-10 text-blue",
  director: "bg-success-tint text-success",
  employee: "bg-ice-30 text-text-secondary",
  admin: "bg-blue-10 text-blue",
};

const roleLabel: Record<string, string> = {
  "co-ceo": "Co-CEO",
  director: "Director",
  employee: "Employee",
  admin: "Admin",
};

export default function TeamPage() {
  const { data: rawData, isLoading, error } = useTeam();
  // api.get unwraps { data: T } → T, so rawData is the array directly
  const teamMembers: any[] = (rawData as any[]) ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-10 flex items-center justify-center text-blue">
            <UsersThreeIcon size={22} weight="light" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-aptos)] text-xl font-semibold text-navy">
              Team
            </h1>
            <p className="text-xs text-text-muted">Manage team members</p>
          </div>
        </div>
{/* Invite Member — not yet implemented */}
      </div>

      {/* ── Team Grid ── */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-text-muted">Loading team...</div>
      )}
      {error && (
        <div className="text-center py-12 text-sm text-error">Failed to load team members.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5 hover:shadow-level-2 hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Top: Avatar + Info */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                <span className="text-sm text-white font-medium leading-none">
                  {member.initials}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-navy truncate">
                    {member.name}
                  </h3>
                  {member.status === "active" ? (
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  ) : (
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-[10px] text-warning font-medium">
                        Invited
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-text-muted mt-0.5">
                  <EnvelopeIcon size={12} weight="light" />
                  <span className="text-xs truncate">{member.email}</span>
                </div>
                <span
                  className={`inline-block mt-1.5 text-[10px] uppercase tracking-[0.08em] font-medium px-2 py-0.5 rounded-full ${roleBadge[member.role]}`}
                >
                  {roleLabel[member.role]}
                </span>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-muted uppercase tracking-[0.06em] font-medium">
                  Utilization
                </span>
                <span className="text-xs text-text-secondary font-medium">
                  {member.utilizationTarget ?? 0}%
                </span>
              </div>
              <div className="w-full bg-ice-50 rounded-full h-1.5">
                <div
                  className="bg-blue rounded-full h-1.5 transition-all duration-500"
                  style={{ width: `${member.utilizationTarget ?? 0}%` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
              <span>
                <strong className="text-navy">{member.activeTasks}</strong> active
              </span>
              <span>
                <strong className="text-navy">{member.ticketsResolved}</strong> resolved
              </span>
            </div>

            {/* Department */}
            {member.department && (
              <p className="text-xs text-text-muted mt-3">
                {member.department}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
