"use client";

import { useState } from "react";
import {
  UsersThreeIcon, AtIcon, TicketIcon, ListChecksIcon,
  ToggleLeftIcon, ToggleRightIcon,
} from "@phosphor-icons/react";
import { useTeam, useUpdateTeamMember } from "@/hooks/use-team";
import { cn } from "@/lib/utils";

const roleBadge: Record<string, { bg: string; text: string; label: string }> = {
  "co-ceo": { bg: "bg-blue-10", text: "text-blue", label: "Owner" },
  director: { bg: "bg-success-tint", text: "text-success", label: "Director" },
  employee: { bg: "bg-ice-30", text: "text-text-secondary", label: "Employee" },
  admin: { bg: "bg-blue-10", text: "text-blue", label: "Admin" },
};

type Filter = "all" | "active" | "inactive";

export default function TeamPage() {
  const { data: rawData, isLoading, error } = useTeam();
  const updateMember = useUpdateTeamMember();
  const [filter, setFilter] = useState<Filter>("active");

  const teamMembers: any[] = (rawData as any[]) ?? [];

  const filtered = teamMembers.filter((m) => {
    if (filter === "all") return true;
    if (filter === "active") return m.status === "active";
    return m.status !== "active";
  });

  const activeCount = teamMembers.filter((m) => m.status === "active").length;
  const inactiveCount = teamMembers.filter((m) => m.status !== "active").length;

  function toggleStatus(member: any) {
    const newStatus = member.status === "active" ? "inactive" : "active";
    updateMember.mutate({ id: member.id, data: { status: newStatus } });
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-ice-30 rounded-xl p-1 w-fit">
        {(["all", "active", "inactive"] as Filter[]).map((f) => {
          const count = f === "all" ? teamMembers.length : f === "active" ? activeCount : inactiveCount;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-4 rounded-lg text-sm font-medium transition-all duration-150 capitalize flex items-center gap-1.5",
                filter === f
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {f}
              <span className={cn(
                "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                filter === f ? "bg-blue-10 text-blue" : "bg-ice text-text-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && <div className="text-center py-16 text-sm text-text-muted">Loading team...</div>}
      {error && <div className="text-center py-16 text-sm text-error">Failed to load team members.</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <UsersThreeIcon size={48} weight="light" className="text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">No {filter !== "all" ? filter : ""} team members.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member: any) => {
          const role = roleBadge[member.role] ?? roleBadge.employee;
          const isActive = member.status === "active";
          const isToggling = updateMember.isPending && updateMember.variables?.id === member.id;

          return (
            <div
              key={member.id}
              className={cn(
                "bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 transition-all duration-200 hover:shadow-level-2 hover:-translate-y-0.5",
                !isActive && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3.5">
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                  isActive ? "bg-navy-80" : "bg-ice"
                )}>
                  <span className={cn(
                    "text-[13px] font-semibold leading-none",
                    isActive ? "text-white" : "text-text-muted"
                  )}>
                    {member.initials}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[14px] text-text-primary truncate">{member.name}</h3>
                    <span className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      isActive ? "bg-success" : "bg-ice"
                    )} title={isActive ? "Active" : "Inactive"} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn("inline-flex text-[10px] uppercase tracking-[0.06em] font-semibold px-2 py-0.5 rounded-full", role.bg, role.text)}>
                      {role.label}
                    </span>
                    {member.department && <span className="text-[11px] text-text-muted">· {member.department}</span>}
                  </div>
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => toggleStatus(member)}
                  disabled={isToggling}
                  title={isActive ? "Deactivate member" : "Reactivate member"}
                  className={cn(
                    "shrink-0 transition-colors duration-150 disabled:opacity-40",
                    isActive ? "text-success hover:text-error" : "text-text-muted hover:text-success"
                  )}
                >
                  {isActive
                    ? <ToggleRightIcon size={24} weight="fill" />
                    : <ToggleLeftIcon size={24} weight="light" />
                  }
                </button>
              </div>

              <div className="flex items-center gap-1.5 mt-3.5 text-text-muted">
                <AtIcon size={13} weight="light" />
                <span className="text-[12px] truncate">{member.email}</span>
              </div>

              {isActive && (
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
              )}

              {!isActive && (
                <div className="mt-4 pt-4 border-t border-ice/50">
                  <span className="text-[11px] text-text-muted italic">Inactive — not counted in metrics</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
