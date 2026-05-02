"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BuildingsIcon, TicketIcon, KanbanIcon, UsersThreeIcon,
  ShieldCheckIcon, CaretRightIcon,
  ArrowsClockwiseIcon, CalendarBlankIcon, PlusIcon, ExportIcon,
  RobotIcon, ArrowUpIcon, ArrowDownIcon,
  StackIcon, DesktopIcon, CloudIcon,
} from "@phosphor-icons/react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { useDashboard } from "@/hooks/use-dashboard";
import { useTickets, useTicketChartData } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import { useTechStack } from "@/hooks/use-tech-stack";
import { useAuth } from "@/hooks/use-auth";
import { useClientFilter } from "@/hooks/use-client-filter";
import type { Ticket } from "@/data/types";
import { cn } from "@/lib/utils";

/* Sparklines removed — were hardcoded fake data, not from any API */

type ChartRange = "7d" | "30d" | "90d";
const chartLabels: Record<ChartRange, string> = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days" };

const statusDotColor: Record<string, string> = {
  "On Track": "bg-success",
  "At Risk": "bg-warning",
  Delayed: "bg-error",
};

const todayFormatted = new Date().toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

export default function DashboardPage() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("7d");
  const [syncing, setSyncing] = useState(false);

  const { data: auth } = useAuth();
  const { clientId, clientName, isFiltered } = useClientFilter();
  const { data: dashboard, isLoading } = useDashboard();
  const { data: ticketsData } = useTickets({ limit: 5, sort: "created_at", order: "desc", clientId: clientId ?? undefined });
  const { data: projectsData } = useProjects({ limit: 10, sort: "created_at", order: "desc", clientId: clientId ?? undefined });
  const { data: chartData } = useTicketChartData(chartRange);
  const { data: techStackRaw } = useTechStack(clientId ?? undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const techStats = (techStackRaw as any)?.stats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ticketChartData: any[] = (chartData as any[]) ?? [];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 500);
  };

  const d = dashboard;
  const recentTickets = (ticketsData as { data?: Array<Record<string, unknown>> })?.data ?? [];
  const activeProjects = (projectsData as { data?: Array<Record<string, unknown>> })?.data ?? [];
  const projectStatusData = d ? [
    { name: "On Track", value: d.projects.onTrack, color: "#0D7C5F" },
    { name: "At Risk", value: d.projects.atRisk, color: "#B8860B" },
    { name: "Delayed", value: d.projects.delayed, color: "#C53030" },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Zone A: Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-9 tracking-[-0.02em] text-text-primary">
            Good morning{auth?.name ? `, ${auth.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {isFiltered ? `Viewing ${clientName}` : "Here's your management overview"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-text-muted">
          <div className="flex items-center gap-1.5">
            <CalendarBlankIcon size={16} weight="light" />
            <span className="text-xs">{todayFormatted}</span>
          </div>
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-blue transition-colors duration-150"
          >
            <ArrowsClockwiseIcon
              size={14}
              weight="light"
              className={syncing ? "animate-spin" : ""}
            />
            Last synced: 2 min ago
          </button>
        </div>
      </div>

      {/* Snapshot Strip — 3 panels, each answers one question */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        role="region"
        aria-label="Key metrics overview"
      >
        {/* Panel 1: Clients Overview */}
        <button
          type="button"
          className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5 text-left card-hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 transition-shadow"
          onClick={() => router.push("/clients")}
          aria-label={`${d?.clients.total ?? 0} active clients. ${d?.tickets.total ?? 0} total tickets. Click to view clients.`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-tight tracking-[-0.02em] text-navy">
                  {d?.clients.total ?? "—"}
                </span>
                <span className="text-[12px] text-text-muted">active clients</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {d?.tickets.total ?? 0} total tickets across all clients
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ice/60 text-[12px]" aria-hidden="true">
            <BuildingsIcon size={13} weight="light" className="text-text-muted" />
            <span className="font-semibold text-text-primary">{d?.tickets.resolvedLast30d ?? 0}</span>
            <span className="text-text-muted">tickets resolved this month</span>
          </div>
        </button>

        {/* Panel 2: Tickets & SLA */}
        <button
          type="button"
          className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5 text-left card-hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 transition-shadow"
          onClick={() => router.push("/tickets")}
          aria-label={`${d?.tickets.open ?? 0} open tickets. ${d?.tickets.critical ?? 0} critical, ${d?.tickets.pending ?? 0} pending. Click to view tickets.`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-tight tracking-[-0.02em] text-navy">
                  {d?.tickets.open ?? "—"}
                </span>
                <span className="text-[12px] text-text-muted">open tickets</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {d?.tickets.critical ?? 0} critical, {d?.tickets.pending ?? 0} pending
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ice/60 text-[12px]" aria-hidden="true">
            <ShieldCheckIcon size={13} weight="light" className="text-text-muted" />
            <span className="font-semibold text-text-primary">{d ? `${Math.round(d.tickets.avgResolutionHours)}h avg` : "—"}</span>
            <span className="text-text-muted">resolution</span>
          </div>
        </button>

        {/* Panel 3: Projects & Team */}
        <button
          type="button"
          className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5 text-left card-hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 transition-shadow"
          onClick={() => router.push("/projects")}
          aria-label={`${d?.projects.total ?? 0} active projects. ${d?.projects.atRisk ?? 0} at risk, ${d?.projects.delayed ?? 0} delayed. ${d?.team.totalMembers ?? 0} team members. Click to view projects.`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-tight tracking-[-0.02em] text-navy">
                  {d?.projects.total ?? "—"}
                </span>
                <span className="text-[12px] text-text-muted">active projects</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {d && (d.projects.atRisk + d.projects.delayed) > 0
                  ? `${d.projects.atRisk} at risk, ${d.projects.delayed} delayed`
                  : "All on track"
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ice/60 text-[12px]" aria-hidden="true">
            <UsersThreeIcon size={13} weight="light" className="text-text-muted" />
            <span className="font-semibold text-text-primary">{d?.team.totalMembers ?? 0}</span>
            <span className="text-text-muted">team members</span>
          </div>
        </button>
      </motion.div>

      {/* Tech Stack Health — only shown when there's data */}
      {techStats && (techStats.software.total > 0 || techStats.infrastructure.total > 0 || techStats.cloud.total > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-10 flex items-center justify-center">
              <StackIcon size={18} weight="light" className="text-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{techStats.software.total} software</p>
              <p className="text-xs text-text-muted">
                {techStats.software.expiring > 0
                  ? <span className="text-warning">{techStats.software.expiring} expiring soon</span>
                  : "All active"
                }
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success-tint flex items-center justify-center">
              <DesktopIcon size={18} weight="light" className="text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{techStats.infrastructure.total} devices</p>
              <p className="text-xs text-text-muted">
                {techStats.infrastructure.offline > 0
                  ? <span className="text-error">{techStats.infrastructure.offline} offline</span>
                  : "All online"
                }
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-10 flex items-center justify-center">
              <CloudIcon size={18} weight="light" className="text-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{techStats.cloud.total} cloud services</p>
              <p className="text-xs text-text-muted">{techStats.cloud.active} active</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Activity Chart - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary">
              Ticket Activity
            </h2>
            <div className="flex items-center rounded-lg border border-ice/60 overflow-hidden shadow-level-1">
              {(["7d", "30d", "90d"] as ChartRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    chartRange === range
                      ? "bg-navy text-white"
                      : "text-text-secondary hover:bg-ice-30"
                  }`}
                >
                  {chartLabels[range]}
                </button>
              ))}
            </div>
          </div>
          {ticketChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketChartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF2" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#8896A6" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis tick={{ fontSize: 11, fill: "#8896A6" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-text-muted capitalize">{value}</span>}
                />
                <Bar dataKey="created" name="Created" fill="#C53030" radius={[2, 2, 0, 0]} barSize={chartRange === "7d" ? 24 : chartRange === "30d" ? 10 : 4} />
                <Bar dataKey="resolved" name="Resolved" fill="#0D7C5F" radius={[2, 2, 0, 0]} barSize={chartRange === "7d" ? 24 : chartRange === "30d" ? 10 : 4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[220px] text-center">
              <p className="text-sm text-text-muted">No ticket activity data available for this period.</p>
            </div>
          )}
        </div>

        {/* Projects by Status - 1 col */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary mb-5">
            Projects by Status
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                {projectStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {projectStatusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-text-muted">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary">
            Recent Tickets
          </h2>
          <button
            onClick={() => router.push("/tickets")}
            className="flex items-center gap-1 text-xs font-medium text-blue hover:underline"
          >
            View all <CaretRightIcon size={12} weight="light" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ice">
                {["Ticket #", "Subject", "Client", "Status", "Priority", "Updated"].map((h) => (
                  <th key={h} className="pb-2 pr-4 text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket: Record<string, unknown>) => (
                <motion.tr
                  key={ticket.id as string}
                  whileHover={{ backgroundColor: "rgba(232,240,250,0.4)" }}
                  className="border-b border-ice last:border-0 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4"><span className="font-mono text-sm text-blue">#{ticket.ticketNumber as string}</span></td>
                  <td className="py-3 pr-4 text-sm text-text-primary max-w-[220px] truncate">{ticket.subject as string}</td>
                  <td className="py-3 pr-4 text-xs text-text-secondary">{ticket.clientName as string}</td>
                  <td className="py-3 pr-4"><StatusBadge status={ticket.status as "Open" | "Pending" | "Closed"} /></td>
                  <td className="py-3 pr-4"><PriorityIndicator priority={ticket.priority as "Critical" | "High" | "Medium" | "Low"} /></td>
                  <td className="py-3 text-xs text-text-muted whitespace-nowrap">{ticket.updatedAt ? new Date(ticket.updatedAt as string).toLocaleDateString() : ""}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary">
            Active Projects
          </h2>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1 text-xs font-medium text-blue hover:underline"
          >
            View all <CaretRightIcon size={12} weight="light" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {activeProjects.map((project: Record<string, unknown>) => (
            <div
              key={project.id as string}
              className="min-w-[300px] border border-ice/50 rounded-2xl p-5 bg-white shrink-0 hover:shadow-level-2 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <p className="font-[family-name:var(--font-aptos)] font-semibold text-sm text-text-primary truncate">
                {project.name as string}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{project.clientName as string}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${statusDotColor[project.status as string] ?? "bg-gray-400"}`} />
                <span className="text-xs text-text-secondary">{project.status as string}</span>
              </div>
              <div className="mt-3 w-full bg-ice-50 rounded-full h-1.5">
                <div className="bg-blue h-1.5 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs text-text-muted">{project.tasksCompleted as number}/{project.totalTasks as number} tasks</span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <CalendarBlankIcon size={12} weight="light" />{project.dueDate as string}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 bg-navy/95 backdrop-blur-xl px-5 py-3 rounded-full shadow-level-4">
          <button
            onClick={() => router.push("/tickets")}
            className="flex items-center gap-2 bg-blue hover:bg-blue-light text-white text-xs font-medium px-4 py-2 rounded-full transition-colors duration-150"
          >
            <PlusIcon size={14} weight="light" />
            New Ticket
          </button>
          <button className="flex items-center gap-2 text-text-on-dark-muted hover:text-white text-xs font-medium px-3 py-2 rounded-full transition-colors duration-150">
            <ExportIcon size={14} weight="light" />
            Export
          </button>
          <button
            onClick={() => router.push("/ai-assistant")}
            className="flex items-center gap-2 text-text-on-dark-muted hover:text-white text-xs font-medium px-3 py-2 rounded-full transition-colors duration-150"
          >
            <RobotIcon size={14} weight="light" />
            AI Assistant
          </button>
        </div>
      </div>

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

/* Inline trend badge — compact directional indicator */
function TrendBadge({ value, direction, sentiment }: { value: string; direction: "up" | "down"; sentiment: "positive" | "negative" }) {
  const color = sentiment === "positive" ? "text-success" : "text-error";
  const Icon = direction === "up" ? ArrowUpIcon : ArrowDownIcon;
  const srLabel = `${direction === "up" ? "increased" : "decreased"} by ${value}`;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", color)} role="img" aria-label={srLabel}>
      <Icon size={10} weight="bold" aria-hidden="true" />
      <span aria-hidden="true">{value}</span>
    </span>
  );
}
