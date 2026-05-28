"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingsIcon, TicketIcon, KanbanIcon,
  ShieldCheckIcon, CaretRightIcon,
  CalendarBlankIcon, ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { KpiCard } from "@/components/shared/kpi-card";
import { useDashboard, useMyDashboard } from "@/hooks/use-dashboard";
import { useTickets, useTicketChartData } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useClientFilter } from "@/hooks/use-client-filter";
import type { Ticket } from "@/data/types";
import { cn } from "@/lib/utils";

type ChartRange = "7d" | "30d" | "90d";

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const todayFormatted = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

export default function DashboardPage() {
  const perms = usePermissions();
  if (perms.seePersonalDashboardOnly) return <EmployeeDashboard />;
  return <ManagementDashboard />;
}

function ManagementDashboard() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");

  const { data: auth } = useAuth();
  const { clientId, clientName, isFiltered } = useClientFilter();
  const { data: dashboard } = useDashboard();
  const { data: ticketsData } = useTickets({ limit: 5, sort: "created_at", order: "desc", clientId: clientId ?? undefined });
  const { data: projectsData } = useProjects({ limit: 6, sort: "created_at", order: "desc", clientId: clientId ?? undefined });
  const { data: chartData } = useTicketChartData(chartRange);

  const d = dashboard;
  const ticketChartData: any[] = (chartData as any[]) ?? [];
  const recentTickets = (ticketsData as { data?: Array<Record<string, unknown>> })?.data ?? [];
  const activeProjects = (projectsData as { data?: Array<Record<string, unknown>> })?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] leading-tight tracking-[-0.02em] text-text-primary">
            {getGreeting()}{auth?.name ? `, ${auth.name}` : ""}
          </h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {isFiltered ? `Viewing ${clientName}` : "Here's your management overview"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          <span className="flex items-center gap-1.5 text-[12px]">
            <CalendarBlankIcon size={14} weight="light" />
            {todayFormatted}
          </span>
          {d?.lastSyncedAt && (
            <span className="flex items-center gap-1.5 text-[12px]">
              <ArrowsClockwiseIcon size={13} weight="light" />
              Synced {formatTimeAgo(d.lastSyncedAt)}
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<BuildingsIcon size={20} weight="light" />}
          value={String(d?.clients.total ?? "—")}
          label="Clients"
          iconBgClass="bg-blue-10" iconColorClass="text-blue"
          onClick={() => router.push("/clients")}
          index={0}
        />
        <KpiCard
          icon={<TicketIcon size={20} weight="light" />}
          value={String(d?.tickets.open ?? "—")}
          label="Open Tickets"
          iconBgClass="bg-error/10" iconColorClass="text-error"
          onClick={() => router.push("/tickets")}
          index={1}
        />
        <KpiCard
          icon={<ShieldCheckIcon size={20} weight="light" />}
          value={d ? `${Math.round(d.tickets.avgResolutionHours)}h` : "—"}
          label="Avg Resolution"
          iconBgClass="bg-warning/10" iconColorClass="text-warning"
          index={2}
        />
        <KpiCard
          icon={<KanbanIcon size={20} weight="light" />}
          value={String(d?.projects.total ?? "—")}
          label="Active Projects"
          iconBgClass="bg-success-tint" iconColorClass="text-success"
          onClick={() => router.push("/projects")}
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket Activity — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Ticket Activity</h2>
            <div className="flex rounded-lg border border-ice overflow-hidden">
              {(["7d", "30d", "90d"] as ChartRange[]).map((r) => (
                <button key={r} onClick={() => setChartRange(r)}
                  className={cn("px-3 py-1.5 text-[11px] font-medium transition-colors",
                    chartRange === r ? "bg-navy text-white" : "text-text-secondary hover:bg-ice-30"
                  )}>
                  {r === "7d" ? "7D" : r === "30d" ? "30D" : "90D"}
                </button>
              ))}
            </div>
          </div>
          {ticketChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8896A6" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fontSize: 11, fill: "#8896A6" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
                  formatter={(value: string) => <span className="text-[11px] text-text-muted capitalize">{value}</span>} />
                <Bar dataKey="created" name="Created" fill="#C53030" radius={[2, 2, 0, 0]} barSize={chartRange === "7d" ? 24 : chartRange === "30d" ? 10 : 4} />
                <Bar dataKey="resolved" name="Resolved" fill="#0D7C5F" radius={[2, 2, 0, 0]} barSize={chartRange === "7d" ? 24 : chartRange === "30d" ? 10 : 4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[13px] text-text-muted">No ticket activity data.</div>
          )}
        </div>

        {/* Projects by Status — 1 col */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-5">Projects by Status</h2>
          {d ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "On Track", value: d.projects.onTrack, color: "#0D7C5F" },
                      { name: "At Risk", value: d.projects.atRisk, color: "#B8860B" },
                      { name: "Delayed", value: d.projects.delayed, color: "#C53030" },
                    ]}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={2}
                  >
                    <Cell fill="#0D7C5F" />
                    <Cell fill="#B8860B" />
                    <Cell fill="#C53030" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} itemStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {[
                  { label: "On Track", value: d.projects.onTrack, color: "#0D7C5F" },
                  { label: "At Risk", value: d.projects.atRisk, color: "#B8860B" },
                  { label: "Delayed", value: d.projects.delayed, color: "#C53030" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[11px] text-text-muted">{s.label} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-text-muted">Loading...</div>
          )}
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Recent Tickets</h2>
          <button onClick={() => router.push("/tickets")} className="flex items-center gap-1 text-[12px] font-medium text-blue hover:underline">
            View all <CaretRightIcon size={11} weight="bold" />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-t border-ice/60">
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted pl-6 pr-4 py-3">Ticket</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Subject</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Client</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Status</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Priority</th>
            </tr>
          </thead>
          <tbody>
            {recentTickets.map((t: Record<string, unknown>) => (
              <tr key={t.id as string} onClick={() => setSelectedTicket(t as unknown as Ticket)}
                className="border-t border-ice/40 cursor-pointer hover:bg-blue-10/30 transition-colors">
                <td className="pl-6 pr-4 py-3"><span className="font-mono text-[13px] text-blue">#{String(t.ticketNumber ?? t.id).split("_").pop()}</span></td>
                <td className="px-4 py-3 text-[13px] text-text-primary max-w-[240px] truncate">{t.subject as string}</td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{t.clientName as string}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status as "Open" | "Pending" | "Closed"} /></td>
                <td className="px-4 py-3"><PriorityIndicator priority={t.priority as "Critical" | "High" | "Medium" | "Low"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Active Projects</h2>
          <button onClick={() => router.push("/projects")} className="flex items-center gap-1 text-[12px] font-medium text-blue hover:underline">
            View all <CaretRightIcon size={11} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
          {activeProjects.map((p: Record<string, unknown>) => {
            const statusColor = p.status === "On Track" ? "text-success" : p.status === "At Risk" ? "text-warning" : "text-error";
            const statusDot = p.status === "On Track" ? "bg-success" : p.status === "At Risk" ? "bg-warning" : "bg-error";
            return (
              <div key={p.id as string} onClick={() => router.push(`/projects/${p.id}`)}
                className="border border-ice/50 rounded-xl p-4 hover:shadow-level-1 hover:-translate-y-0.5 cursor-pointer transition-all duration-200">
                <p className="font-[family-name:var(--font-aptos)] font-semibold text-[13px] text-text-primary truncate">{p.name as string}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{p.clientName as string}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
                  <span className={cn("text-[11px] font-medium", statusColor)}>{p.status as string}</span>
                </div>
                <div className="mt-3 w-full bg-ice-50 rounded-full h-1.5">
                  <div className="bg-blue h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-text-muted">{p.tasksCompleted as number}/{p.totalTasks as number} tasks</span>
                  <span className="text-[11px] text-text-muted font-medium">{p.progress as number}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

function EmployeeDashboard() {
  const router = useRouter();
  const { data: auth } = useAuth();
  // Use the same team-wide dashboard data — employees see company KPIs without financials
  const { data: dashboard } = useDashboard();
  const { data: ticketsData } = useTickets({ limit: 5, sort: "created_at", order: "desc" });
  const { data: projectsData } = useProjects({ limit: 6, sort: "created_at", order: "desc" });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const d = dashboard;
  const recentTickets = (ticketsData as { data?: Array<Record<string, unknown>> })?.data ?? [];
  const activeProjects = (projectsData as { data?: Array<Record<string, unknown>> })?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] leading-tight tracking-[-0.02em] text-text-primary">
          {getGreeting()}{auth?.name ? `, ${auth.name}` : ""}
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          <CalendarBlankIcon size={14} weight="light" className="inline mr-1" />
          {todayFormatted}
        </p>
      </div>

      {/* KPIs — same as management but no clients count, showing operational metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<TicketIcon size={20} weight="light" />}
          value={String(d?.tickets.open ?? "—")}
          label="Open Tickets"
          iconBgClass="bg-error/10" iconColorClass="text-error"
          onClick={() => router.push("/tickets")}
          index={0}
        />
        <KpiCard
          icon={<ShieldCheckIcon size={20} weight="light" />}
          value={d ? `${Math.round(d.tickets.avgResolutionHours)}h` : "—"}
          label="Avg Resolution"
          iconBgClass="bg-warning/10" iconColorClass="text-warning"
          index={1}
        />
        <KpiCard
          icon={<KanbanIcon size={20} weight="light" />}
          value={String(d?.projects.total ?? "—")}
          label="Active Projects"
          iconBgClass="bg-blue-10" iconColorClass="text-blue"
          onClick={() => router.push("/projects")}
          index={2}
        />
        <KpiCard
          icon={<BuildingsIcon size={20} weight="light" />}
          value={String(d?.clients.total ?? "—")}
          label="Clients"
          iconBgClass="bg-success-tint" iconColorClass="text-success"
          onClick={() => router.push("/clients")}
          index={3}
        />
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Recent Tickets</h2>
          <button onClick={() => router.push("/tickets")} className="flex items-center gap-1 text-[12px] font-medium text-blue hover:underline">
            View all <CaretRightIcon size={11} weight="bold" />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-t border-ice/60">
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted pl-6 pr-4 py-3">Ticket</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Subject</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Client</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Status</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Priority</th>
            </tr>
          </thead>
          <tbody>
            {recentTickets.map((t: Record<string, unknown>) => (
              <tr key={t.id as string} onClick={() => setSelectedTicket(t as unknown as Ticket)}
                className="border-t border-ice/40 cursor-pointer hover:bg-blue-10/30 transition-colors">
                <td className="pl-6 pr-4 py-3"><span className="font-mono text-[13px] text-blue">#{String(t.ticketNumber ?? t.id).split("_").pop()}</span></td>
                <td className="px-4 py-3 text-[13px] text-text-primary max-w-[240px] truncate">{t.subject as string}</td>
                <td className="px-4 py-3 text-[12px] text-text-secondary">{t.clientName as string}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status as "Open" | "Pending" | "Closed"} /></td>
                <td className="px-4 py-3"><PriorityIndicator priority={t.priority as "Critical" | "High" | "Medium" | "Low"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Active Projects</h2>
          <button onClick={() => router.push("/projects")} className="flex items-center gap-1 text-[12px] font-medium text-blue hover:underline">
            View all <CaretRightIcon size={11} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
          {activeProjects.map((p: Record<string, unknown>) => {
            const statusColor = p.status === "On Track" ? "text-success" : p.status === "At Risk" ? "text-warning" : "text-error";
            const statusDot = p.status === "On Track" ? "bg-success" : p.status === "At Risk" ? "bg-warning" : "bg-error";
            return (
              <div key={p.id as string} onClick={() => router.push(`/projects/${p.id}`)}
                className="border border-ice/50 rounded-xl p-4 hover:shadow-level-1 hover:-translate-y-0.5 cursor-pointer transition-all duration-200">
                <p className="font-[family-name:var(--font-aptos)] font-semibold text-[13px] text-text-primary truncate">{p.name as string}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{p.clientName as string}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
                  <span className={cn("text-[11px] font-medium", statusColor)}>{p.status as string}</span>
                </div>
                <div className="mt-3 w-full bg-ice-50 rounded-full h-1.5">
                  <div className="bg-blue h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-text-muted">{p.tasksCompleted as number}/{p.totalTasks as number} tasks</span>
                  <span className="text-[11px] text-text-muted font-medium">{p.progress as number}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
