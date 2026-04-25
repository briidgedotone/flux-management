"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CaretLeftIcon, EnvelopeIcon, PhoneIcon, CalendarBlankIcon,
  TicketIcon, KanbanIcon, CurrencyDollarIcon, ShieldCheckIcon,
} from "@phosphor-icons/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { useClient, useClientStats } from "@/hooks/use-clients";
import { useTickets } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import type { Ticket } from "@/data/types";

type ClientTab = "overview" | "tickets" | "projects" | "contacts";

const tabItems: { id: ClientTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tickets", label: "Tickets" },
  { id: "projects", label: "Projects" },
  { id: "contacts", label: "Contacts" },
];

const healthColors: Record<string, { dot: string; text: string }> = {
  healthy: { dot: "bg-success", text: "text-success" },
  "at-risk": { dot: "bg-warning", text: "text-warning" },
  critical: { dot: "bg-error", text: "text-error" },
};

const statusDotColor: Record<string, string> = {
  "On Track": "bg-success",
  "At Risk": "bg-warning",
  Delayed: "bg-error",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const clientId = params.id as string;
  const { data: client, isLoading } = useClient(clientId);
  const { data: ticketsResp } = useTickets({ clientId, limit: 50 });
  const { data: projectsResp } = useProjects({ clientId, limit: 50 });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-muted">Loading...</p></div>;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-text-muted">Client not found</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientTickets: any[] = ((ticketsResp as any)?.data as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientProjects: any[] = ((projectsResp as any)?.data as any[]) ?? [];
  const healthScore = (c.healthScore as string) ?? "healthy";
  const hc = healthColors[healthScore] || healthColors.healthy;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.push("/clients")} className="flex items-center gap-1 text-sm text-text-secondary hover:text-blue transition-colors">
        <CaretLeftIcon size={16} weight="light" /> Back to Clients
      </button>

      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] tracking-[-0.02em] text-text-primary">{c.companyName as string}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{c.industry as string}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
              <span className={`text-xs font-medium capitalize ${hc.text}`}>{healthScore}</span>
            </div>
            <StatusBadge status={(c.contractStatus as string) === "active" ? "Open" : (c.contractStatus as string) === "expiring" ? "Pending" : "Closed"} />
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { icon: <CurrencyDollarIcon size={16} weight="light" />, label: "Monthly Revenue", value: `$${(c.monthlyRevenue as number ?? 0).toLocaleString()}` },
            { icon: <ShieldCheckIcon size={16} weight="light" />, label: "SLA Target", value: `${c.slaTarget ?? 95}%` },
            { icon: <TicketIcon size={16} weight="light" />, label: "Open Tickets", value: String(c.openTickets ?? 0) },
            { icon: <KanbanIcon size={16} weight="light" />, label: "Active Projects", value: String(c.activeProjects ?? 0) },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-ice-30/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-text-muted mb-1">{kpi.icon}<span className="text-[10px] uppercase tracking-[0.08em] font-medium">{kpi.label}</span></div>
              <span className="font-[family-name:var(--font-aptos)] font-bold text-xl text-navy">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-4 mt-5 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5"><EnvelopeIcon size={14} weight="light" />{(c.primaryContact as { name: string; email: string; phone?: string }).email}</span>
          {(c.primaryContact as { name: string; email: string; phone?: string }).phone && <span className="flex items-center gap-1.5"><PhoneIcon size={14} weight="light" />{(c.primaryContact as { name: string; email: string; phone?: string }).phone}</span>}
          <span className="flex items-center gap-1.5"><CalendarBlankIcon size={14} weight="light" />Since {(c.contractStartDate as string ?? "")}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ice">
        {tabItems.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? "text-blue border-blue" : "text-text-secondary border-transparent hover:text-text-primary"
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
            <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">Recent Tickets</h3>
            {clientTickets.length === 0 ? (
              <p className="text-sm text-text-muted">No tickets for this client</p>
            ) : (
              <div className="space-y-2">
                {clientTickets.slice(0, 5).map((t) => (
                  <motion.div key={t.id as string} whileHover={{ backgroundColor: "rgba(232,240,250,0.4)" }}
                    onClick={() => setSelectedTicket(t as unknown as Ticket)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-blue">#{t.id}</span>
                      <p className="text-sm text-text-primary truncate">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <StatusBadge status={t.status} />
                      <PriorityIndicator priority={t.priority} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
            <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">Active Projects</h3>
            {clientProjects.length === 0 ? (
              <p className="text-sm text-text-muted">No projects for this client</p>
            ) : (
              <div className="space-y-3">
                {clientProjects.map((p) => (
                  <div key={p.id as string} onClick={() => router.push(`/projects/${p.id}`)}
                    className="p-4 border border-ice/50 rounded-xl hover:shadow-level-2 cursor-pointer transition-all">
                    <p className="font-semibold text-sm text-text-primary">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${statusDotColor[p.status]}`} />
                      <span className="text-xs text-text-secondary">{p.status}</span>
                    </div>
                    <div className="mt-2 w-full bg-ice-50 rounded-full h-1.5">
                      <div className="bg-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-text-muted mt-1 block">{p.tasksCompleted}/{p.totalTasks} tasks • Due {p.dueDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ice">
                  {["Ticket #", "Subject", "Status", "Priority", "Assigned To", "Updated"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientTickets.map((t) => (
                  <motion.tr key={t.id as string} whileHover={{ backgroundColor: "rgba(232,240,250,0.4)" }}
                    onClick={() => setSelectedTicket(t as unknown as Ticket)} className="border-b border-ice last:border-0 cursor-pointer">
                    <td className="py-3 pr-4"><span className="font-mono text-sm text-blue">#{t.id}</span></td>
                    <td className="py-3 pr-4 text-sm text-text-primary max-w-[220px] truncate">{t.subject}</td>
                    <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3 pr-4"><PriorityIndicator priority={t.priority} /></td>
                    <td className="py-3 pr-4 text-xs text-text-secondary">{t.assignedToName ?? ""}</td>
                    <td className="py-3 text-xs text-text-muted">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ""}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clientProjects.map((p) => (
            <div key={p.id as string} onClick={() => router.push(`/projects/${p.id}`)}
              className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 hover:shadow-level-2 cursor-pointer transition-all">
              <p className="font-[family-name:var(--font-aptos)] font-semibold text-sm text-text-primary">{p.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{p.category}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${statusDotColor[p.status]}`} />
                <span className="text-xs text-text-secondary">{p.status} • {p.progress}%</span>
              </div>
              <div className="mt-3 w-full bg-ice-50 rounded-full h-1.5">
                <div className="bg-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted">{p.tasksCompleted}/{p.totalTasks} tasks</span>
                <span className="text-xs text-text-muted">Due {p.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">Primary Contact</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy-80 flex items-center justify-center text-white font-semibold">
              {(c.primaryContact as { name: string; email: string; phone?: string }).name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{(c.primaryContact as { name: string; email: string; phone?: string }).name}</p>
              <p className="text-xs text-text-muted">{(c.primaryContact as { name: string; email: string; phone?: string }).email}</p>
              {(c.primaryContact as { name: string; email: string; phone?: string }).phone && <p className="text-xs text-text-muted">{(c.primaryContact as { name: string; email: string; phone?: string }).phone}</p>}
            </div>
          </div>
        </div>
      )}

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}
