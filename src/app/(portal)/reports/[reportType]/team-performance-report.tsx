"use client";

import { useTeamPerformanceReport } from "@/hooks/use-reports";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export function TeamPerformanceReport() {
  const { data: report, isLoading } = useTeamPerformanceReport("30d");

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Loading team data...</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = report as any;
  const members: any[] = r?.members ?? [];
  const avgUtilization = members.length > 0 ? Math.round(members.reduce((s: number, m: any) => s + m.utilizationTarget, 0) / members.length) : 0;
  const totalResolved = members.reduce((s: number, m: any) => s + m.ticketsResolved, 0);

  const productivityData = members.map((m: any) => ({
    name: m.name.split(" ")[0],
    resolved: m.ticketsResolved,
    tasks: m.activeTasks,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiMini label="Team Members" value={String(members.length)} sub="active" />
        <KpiMini label="Avg Utilization Target" value={`${avgUtilization}%`} sub={avgUtilization > 75 ? "High" : "Normal"} />
        <KpiMini label="Tickets Resolved" value={String(totalResolved)} sub="in range" />
      </div>

      {/* Productivity chart */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">
          Productivity by Member
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8896A6" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#8896A6" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
            <Bar dataKey="resolved" name="Tickets Resolved" fill="#15549D" radius={[0, 0, 0, 0]} stackId="a" />
            <Bar dataKey="tasks" name="Active Tasks" fill="#1A6BC4" radius={[4, 4, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Utilization bars */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-5">
          Individual Utilization
        </h3>
        <div className="space-y-4">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                <span className="text-[9px] text-white font-medium">{m.name.split(" ").map((n: string) => n[0]).join("")}</span>
              </div>
              <div className="min-w-[120px]">
                <p className="text-[13px] font-medium text-text-primary">{m.name}</p>
                <p className="text-[11px] text-text-muted capitalize">{m.role?.replace("-", " ")}</p>
              </div>
              <div className="flex-1 h-3 bg-ice-30 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    m.utilizationTarget >= 85 ? "bg-gradient-to-r from-warning to-error" :
                    m.utilizationTarget >= 60 ? "bg-gradient-to-r from-blue to-blue-light" :
                    "bg-gradient-to-r from-success to-success"
                  )}
                  style={{ width: `${m.utilizationTarget}%` }}
                />
              </div>
              <span className="text-[13px] font-semibold text-text-primary w-10 text-right">{m.utilizationTarget}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">Member Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-ice">
                <Th>Member</Th><Th>Role</Th><Th>Dept</Th><Th>Active Tasks</Th><Th>Tickets Resolved</Th><Th>Avg Resolution (h)</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                  <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{m.name}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary capitalize">{m.role?.replace("-", " ")}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{m.department ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-text-primary">{m.activeTasks}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-text-primary">{m.ticketsResolved}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{m.avgResolutionHours?.toFixed(1) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary mt-1">{value}</p>
      <p className="text-[12px] text-text-muted mt-0.5">{sub}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3 first:pl-6">{children}</th>;
}
