"use client";

import {
  UsersThreeIcon,
  AtIcon,
  TicketIcon,
  ListChecksIcon,
} from "@phosphor-icons/react";
import { useTeam } from "@/hooks/use-team";
import { cn } from "@/lib/utils";

const roleBadge: Record<string, { bg: string; text: string; label: string }> = {
  "co-ceo": { bg: "bg-blue-10", text: "text-blue", label: "Co-CEO" },
  director: { bg: "bg-success-tint", text: "text-success", label: "Director" },
  employee: { bg: "bg-ice-30", text: "text-text-secondary", label: "Employee" },
  admin: { bg: "bg-blue-10", text: "text-blue", label: "Admin" },
};

export default function TeamPage() {
  const { data: rawData, isLoading, error } = useTeam();
  const teamMembers: any[] = (rawData as any[]) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-10 flex items-center justify-center">
          <UsersThreeIcon size={22} weight="light" className="text-blue" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-9 tracking-[-0.02em] text-text-primary">Team</h1>
          <p className="text-sm text-text-secondary mt-0.5">{teamMembers.length} team member{teamMembers.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {isLoading && <div className="text-center py-16 text-sm text-text-muted">Loading team...</div>}
      {error && <div className="text-center py-16 text-sm text-error">Failed to load team members.</div>}

      {!isLoading && teamMembers.length === 0 && (
        <div className="text-center py-16">
          <UsersThreeIcon size={48} weight="light" className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No team members yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member: any) => {
          const role = roleBadge[member.role] ?? roleBadge.employee;
          return (
            <div key={member.id}
              className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 hover:shadow-level-2 hover:-translate-y-0.5 transition-all duration-200">
              {/* Top: Avatar + Name + Role */}
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                  <span className="text-[13px] text-white font-semibold leading-none">{member.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[14px] text-text-primary truncate">{member.name}</h3>
                    {member.status === "active" && <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Active" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("inline-flex text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full", role.bg, role.text)}>
                      {role.label}
                    </span>
                    {member.department && (
                      <span className="text-[11px] text-text-muted">· {member.department}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-1.5 mt-3.5 text-text-muted">
                <AtIcon size={13} weight="light" />
                <span className="text-[12px] truncate">{member.email}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 mt-4 pt-4 border-t border-ice/50">
                <div className="flex items-center gap-1.5">
                  <ListChecksIcon size={14} weight="light" className="text-blue" />
                  <span className="text-[12px] text-text-secondary">
                    <strong className="text-text-primary font-semibold">{member.activeTasks ?? 0}</strong> active tasks
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TicketIcon size={14} weight="light" className="text-success" />
                  <span className="text-[12px] text-text-secondary">
                    <strong className="text-text-primary font-semibold">{member.ticketsResolved ?? 0}</strong> resolved
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
