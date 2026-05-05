"use client";

import { useState } from "react";
import {
  TicketIcon, KanbanIcon, FileTextIcon,
  PrinterIcon, CaretLeftIcon,
  CheckCircleIcon, WarningCircleIcon, ClockIcon,
} from "@phosphor-icons/react";
import { useTicketStats } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useClientFilter } from "@/hooks/use-client-filter";
import { cn } from "@/lib/utils";

type ReportType = "ticket-activity" | "project-progress" | "full-summary";
type TimeRange = "7d" | "30d" | "90d";
const rangeLabels: Record<TimeRange, string> = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days" };

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [range, setRange] = useState<TimeRange>("30d");
  const { clientId, clientName, isFiltered } = useClientFilter();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-10 flex items-center justify-center">
          <FileTextIcon size={22} weight="light" className="text-blue" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-9 tracking-[-0.02em] text-text-primary">Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5">{isFiltered ? `Reports for ${clientName}` : "Generate and view reports"}</p>
        </div>
      </div>

      {!reportType ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { type: "ticket-activity" as ReportType, title: "Ticket Activity", desc: "Volume, resolution times, and trends", icon: TicketIcon, color: "bg-error/10 text-error" },
            { type: "project-progress" as ReportType, title: "Project Progress", desc: "Status, completion, and timelines", icon: KanbanIcon, color: "bg-blue-10 text-blue" },
            { type: "full-summary" as ReportType, title: "Management Summary", desc: "Combined weekly digest", icon: FileTextIcon, color: "bg-success-tint text-success" },
          ].map((r) => (
            <button key={r.type} onClick={() => setReportType(r.type)}
              className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 text-left hover:shadow-level-2 hover:-translate-y-0.5 transition-all">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", r.color)}>
                <r.icon size={22} weight="light" />
              </div>
              <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">{r.title}</h3>
              <p className="text-[13px] text-text-muted mt-1">{r.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={() => setReportType(null)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-blue transition-colors">
              <CaretLeftIcon size={14} weight="light" /> Back to Reports
            </button>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-ice overflow-hidden">
                {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
                  <button key={r} onClick={() => setRange(r)}
                    className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                      range === r ? "bg-navy text-white" : "text-text-secondary hover:bg-ice-30"
                    )}>{rangeLabels[r]}</button>
                ))}
              </div>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-text-secondary border border-ice rounded-lg hover:bg-ice-30 transition-colors">
                <PrinterIcon size={13} weight="light" /> Print
              </button>
            </div>
          </div>

          {reportType === "ticket-activity" && <TicketReport range={range} clientId={clientId} clientName={clientName} />}
          {reportType === "project-progress" && <ProjectReport clientId={clientId} clientName={clientName} />}
          {reportType === "full-summary" && <SummaryReport range={range} clientId={clientId} clientName={clientName} />}
        </div>
      )}
    </div>
  );
}

function TicketReport({ range, clientId, clientName }: { range: TimeRange; clientId: string | null; clientName: string | null }) {
  const { data: stats, isLoading } = useTicketStats({ range, clientId: clientId ?? undefined });
  const s = stats as any;
  if (isLoading) return <Loading />;

  const resRate = (s?.createdInRange ?? 0) > 0 ? Math.round(((s?.resolvedInRange ?? 0) / (s?.createdInRange ?? 1)) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 print:border-none print:shadow-none">
      {/* Report Header */}
      <div className="p-7 pb-0">
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Ticket Activity Report</h2>
        <p className="text-[13px] text-text-muted mt-0.5">{clientName ?? "All Clients"} · Last {rangeLabels[range]} · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 mx-7">
        <Metric label="Total Tickets" value={s?.total ?? 0} />
        <Metric label="Open" value={s?.open ?? 0} />
        <Metric label="Pending" value={s?.pending ?? 0} />
        <Metric label="Closed" value={s?.closed ?? 0} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 mx-7">
        <Metric label="Critical" value={s?.critical ?? 0} />
        <Metric label="High Priority" value={s?.high ?? 0} />
        <Metric label="Created" value={s?.createdInRange ?? 0} />
        <Metric label="Resolved" value={s?.resolvedInRange ?? 0} />
      </div>

      {/* Insights */}
      <div className="p-7 space-y-3">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InsightCard icon={<ClockIcon size={16} weight="light" />} label="Avg Resolution" value={`${(s?.avgResolutionHours ?? 0).toFixed(1)}h`} color="bg-blue-10 text-blue" />
          <InsightCard icon={<CheckCircleIcon size={16} weight="light" />} label="Resolution Rate" value={`${resRate}%`} color="bg-success-tint text-success" />
          <InsightCard icon={<WarningCircleIcon size={16} weight="light" />} label="Open Tickets" value={String(s?.open ?? 0)} color={(s?.open ?? 0) > 0 ? "bg-error/10 text-error" : "bg-ice-30 text-text-secondary"} />
        </div>
        {(s?.critical ?? 0) > 0 && (
          <div className="bg-error/5 border border-error/20 rounded-xl p-4 text-[13px] text-error">
            {s.critical} critical ticket{s.critical > 1 ? "s" : ""} requiring immediate attention.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectReport({ clientId, clientName }: { clientId: string | null; clientName: string | null }) {
  const { data: rawData, isLoading } = useProjects(clientId ? { clientId } : {});
  const projects: any[] = (rawData as any)?.data ?? [];
  if (isLoading) return <Loading />;

  const onTrack = projects.filter(p => p.status === "On Track").length;
  const atRisk = projects.filter(p => p.status === "At Risk").length;
  const delayed = projects.filter(p => p.status === "Delayed").length;

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 print:border-none print:shadow-none">
      <div className="p-7 pb-0">
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Project Progress Report</h2>
        <p className="text-[13px] text-text-muted mt-0.5">{clientName ?? "All Clients"} · {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 mx-7">
        <Metric label="Total" value={projects.length} />
        <Metric label="On Track" value={onTrack} />
        <Metric label="At Risk" value={atRisk} />
        <Metric label="Delayed" value={delayed} />
      </div>

      {/* Project Table */}
      {projects.length > 0 && (
        <div className="p-7">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-4">Project Details</h3>
          <div className="overflow-hidden rounded-xl border border-ice/60">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ice/60">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Project</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Client</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3 w-[200px]">Progress</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} className="border-t border-ice/40 hover:bg-blue-10/30 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{p.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium",
                        p.status === "On Track" ? "text-success" : p.status === "At Risk" ? "text-warning" : "text-error"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                          p.status === "On Track" ? "bg-success" : p.status === "At Risk" ? "bg-warning" : "bg-error"
                        )} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-ice-50 rounded-full h-1.5">
                          <div className="bg-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-[11px] text-text-muted font-medium w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-muted text-right tabular-nums">{p.tasksCompleted}/{p.totalTasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryReport({ range, clientId, clientName }: { range: TimeRange; clientId: string | null; clientName: string | null }) {
  const { data: stats } = useTicketStats({ range, clientId: clientId ?? undefined });
  const { data: rawProjects } = useProjects(clientId ? { clientId } : {});
  const { data: clientsResp } = useClients({ limit: 50 });
  const s = stats as any;
  const projects: any[] = (rawProjects as any)?.data ?? [];
  const clients: any[] = (clientsResp as any)?.data ?? [];
  const resRate = (s?.createdInRange ?? 0) > 0 ? Math.round(((s?.resolvedInRange ?? 0) / (s?.createdInRange ?? 1)) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 print:border-none print:shadow-none">
      <div className="p-7 pb-0">
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Management Summary</h2>
        <p className="text-[13px] text-text-muted mt-0.5">{clientName ?? "All Clients"} · Last {rangeLabels[range]} · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Clients */}
      <div className="px-7 pt-6">
        <p className="text-[13px] text-text-secondary"><strong className="text-text-primary">{clients.length}</strong> active clients being managed.</p>
      </div>

      {/* Tickets Section */}
      <div className="px-7 pt-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-3">IT Help Desk</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl overflow-hidden">
          <Metric label="Created" value={s?.createdInRange ?? 0} />
          <Metric label="Resolved" value={s?.resolvedInRange ?? 0} />
          <Metric label="Open Now" value={s?.open ?? 0} />
          <Metric label="Critical" value={s?.critical ?? 0} />
        </div>
        <p className="text-[13px] text-text-secondary mt-3">
          Avg resolution: <strong>{(s?.avgResolutionHours ?? 0).toFixed(1)}h</strong> · Resolution rate: <strong>{resRate}%</strong>
        </p>
      </div>

      {/* Projects Section */}
      <div className="px-7 pt-6 pb-7">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-3">Projects</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Metric label="Total" value={projects.length} />
          <Metric label="On Track" value={projects.filter(p => p.status === "On Track").length} />
          <Metric label="At Risk" value={projects.filter(p => p.status === "At Risk").length} />
          <Metric label="Delayed" value={projects.filter(p => p.status === "Delayed").length} />
        </div>

        {projects.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-ice/60">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ice/60">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-2.5">Project</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-2.5 w-[100px]">Progress</th>
                  <th className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-2.5 w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} className="border-t border-ice/40">
                    <td className="px-4 py-2.5">
                      <span className="text-[13px] text-text-primary">{p.name}</span>
                      <span className="text-[11px] text-text-muted ml-1.5">({p.clientName})</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[13px] font-medium text-text-primary tabular-nums">{p.progress}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn("text-[11px] font-medium",
                        p.status === "On Track" ? "text-success" : p.status === "At Risk" ? "text-warning" : "text-error"
                      )}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared Components ── */

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl border border-ice/40 p-4">
      <p className="text-[10px] uppercase tracking-[0.06em] font-medium text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-[22px] text-text-primary mt-0.5">{value}</p>
    </div>
  );
}

function InsightCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-ice-30/30">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", color)}>{icon}</div>
      <div>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.06em] font-medium">{label}</p>
        <p className="font-[family-name:var(--font-aptos)] font-bold text-[17px] text-navy">{value}</p>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="text-center py-16 text-sm text-text-muted">Generating report...</div>;
}
