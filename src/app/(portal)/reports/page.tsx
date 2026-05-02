"use client";

import { useState } from "react";
import {
  TicketIcon,
  KanbanIcon,
  FileTextIcon,
  CalendarBlankIcon,
  PrinterIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { useTicketStats } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useClientFilter } from "@/hooks/use-client-filter";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

type ReportType = "ticket-activity" | "project-progress" | "full-summary";
type TimeRange = "7d" | "30d" | "90d";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [range, setRange] = useState<TimeRange>("30d");
  const { clientId, clientName, isFiltered } = useClientFilter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle={isFiltered ? `Reports for ${clientName}` : "Generate and view reports across all clients"}
      />

      {!reportType ? (
        <ReportSelector onSelect={setReportType} />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <button onClick={() => setReportType(null)} className="text-sm text-text-secondary hover:text-blue transition-colors">
              &larr; Back to Reports
            </button>
            <div className="flex items-center gap-3">
              {/* Range selector */}
              <div className="flex items-center rounded-lg border border-ice/60 overflow-hidden">
                {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
                  <button key={r} onClick={() => setRange(r)}
                    className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                      range === r ? "bg-navy text-white" : "text-text-secondary hover:bg-ice-30"
                    )}>
                    {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary border border-ice rounded-lg hover:bg-ice-30 transition-colors">
                <PrinterIcon size={14} weight="light" /> Print
              </button>
            </div>
          </div>

          {/* Report content */}
          <div className="print:shadow-none">
            {reportType === "ticket-activity" && <TicketActivityReport range={range} clientId={clientId} clientName={clientName} />}
            {reportType === "project-progress" && <ProjectProgressReport clientId={clientId} clientName={clientName} />}
            {reportType === "full-summary" && <FullSummaryReport range={range} clientId={clientId} clientName={clientName} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportSelector({ onSelect }: { onSelect: (type: ReportType) => void }) {
  const reports = [
    {
      type: "ticket-activity" as ReportType,
      title: "Ticket Activity Report",
      description: "IT Help Desk ticket volume, resolution times, and trends",
      icon: TicketIcon,
      prd: "PRD R1",
    },
    {
      type: "project-progress" as ReportType,
      title: "Project Progress Report",
      description: "Project status, completion percentages, and timelines",
      icon: KanbanIcon,
      prd: "PRD R2",
    },
    {
      type: "full-summary" as ReportType,
      title: "Full Management Summary",
      description: "Combined ticket, project, and team overview — the weekly digest",
      icon: FileTextIcon,
      prd: "PRD R5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {reports.map((r) => (
        <button key={r.type} onClick={() => onSelect(r.type)}
          className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 text-left hover:shadow-level-2 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-xl bg-blue-10 flex items-center justify-center mb-4">
            <r.icon size={22} weight="light" className="text-blue" />
          </div>
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">{r.title}</h3>
          <p className="text-[13px] text-text-muted mt-1">{r.description}</p>
        </button>
      ))}
    </div>
  );
}

function TicketActivityReport({ range, clientId, clientName }: { range: TimeRange; clientId: string | null; clientName: string | null }) {
  const { data: stats, isLoading } = useTicketStats({ range, clientId: clientId ?? undefined });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = stats as any;

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Generating report...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-8 print:border-none print:shadow-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Ticket Activity Report</h2>
          <p className="text-sm text-text-muted mt-0.5">{clientName ?? "All Clients"} &middot; Last {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days &middot; Generated {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <ReportKpi label="Total Tickets" value={String(s?.total ?? 0)} />
        <ReportKpi label="Open" value={String(s?.open ?? 0)} />
        <ReportKpi label="Pending" value={String(s?.pending ?? 0)} />
        <ReportKpi label="Closed" value={String(s?.closed ?? 0)} />
        <ReportKpi label="Critical" value={String(s?.critical ?? 0)} />
        <ReportKpi label="High" value={String(s?.high ?? 0)} />
        <ReportKpi label="Created in Period" value={String(s?.createdInRange ?? 0)} />
        <ReportKpi label="Resolved in Period" value={String(s?.resolvedInRange ?? 0)} />
      </div>

      <div className="border-t border-ice pt-6">
        <h3 className="font-semibold text-base text-text-primary mb-3">Summary</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {s?.createdInRange ?? 0} tickets were created and {s?.resolvedInRange ?? 0} were resolved in the last {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days.
          The average resolution time is {s?.avgResolutionHours?.toFixed(1) ?? "0"} hours.
          {(s?.critical ?? 0) > 0 ? ` There are ${s.critical} critical priority tickets requiring immediate attention.` : " No critical tickets at this time."}
          {(s?.open ?? 0) > 0 ? ` ${s.open} tickets remain open.` : ""}
        </p>
      </div>
    </div>
  );
}

function ProjectProgressReport({ clientId, clientName }: { clientId: string | null; clientName: string | null }) {
  const { data: rawData, isLoading } = useProjects(clientId ? { clientId } : {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: any[] = (rawData as any)?.data ?? [];

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Generating report...</div>;

  const onTrack = projects.filter(p => p.status === "On Track").length;
  const atRisk = projects.filter(p => p.status === "At Risk").length;
  const delayed = projects.filter(p => p.status === "Delayed").length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s: number, p: any) => s + (p.progress ?? 0), 0) / projects.length) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-8 print:border-none print:shadow-none">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Project Progress Report</h2>
        <p className="text-sm text-text-muted mt-0.5">{clientName ?? "All Clients"} &middot; Generated {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <ReportKpi label="Total Projects" value={String(projects.length)} />
        <ReportKpi label="On Track" value={String(onTrack)} />
        <ReportKpi label="At Risk" value={String(atRisk)} />
        <ReportKpi label="Delayed" value={String(delayed)} />
      </div>

      {/* Project list */}
      <div className="border-t border-ice pt-6">
        <h3 className="font-semibold text-base text-text-primary mb-4">Project Details</h3>
        <div className="space-y-4">
          {projects.map((p: any) => (
            <div key={p.id} className="border border-ice/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.clientName}</p>
                </div>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                  p.status === "On Track" ? "text-success bg-success-tint" :
                  p.status === "At Risk" ? "text-warning bg-warning/10" : "text-error bg-error/10"
                )}>{p.status}</span>
              </div>
              <div className="mt-3 w-full bg-ice-50 rounded-full h-2">
                <div className="bg-blue h-2 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-text-muted">
                <span>{p.tasksCompleted}/{p.totalTasks} tasks complete</span>
                <span>{p.progress}%</span>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-sm text-text-muted">No projects found.</p>}
        </div>
      </div>
    </div>
  );
}

function FullSummaryReport({ range, clientId, clientName }: { range: TimeRange; clientId: string | null; clientName: string | null }) {
  const { data: stats } = useTicketStats({ range, clientId: clientId ?? undefined });
  const { data: rawProjects } = useProjects(clientId ? { clientId } : {});
  const { data: clientsResp } = useClients({ limit: 50 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = stats as any;
  const projects: any[] = (rawProjects as any)?.data ?? [];
  const clients: any[] = (clientsResp as any)?.data ?? [];

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-8 print:border-none print:shadow-none">
      <div className="mb-6">
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">Management Summary</h2>
        <p className="text-sm text-text-muted mt-0.5">
          {clientName ?? "All Clients"} &middot; Last {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days &middot; Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Clients overview */}
      <div className="mb-8">
        <h3 className="font-semibold text-base text-text-primary mb-3">Clients</h3>
        <p className="text-sm text-text-secondary">{clients.length} active clients being managed.</p>
      </div>

      {/* Tickets summary */}
      <div className="mb-8 border-t border-ice pt-6">
        <h3 className="font-semibold text-base text-text-primary mb-3">IT Help Desk</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          <ReportKpi label="Created" value={String(s?.createdInRange ?? 0)} />
          <ReportKpi label="Resolved" value={String(s?.resolvedInRange ?? 0)} />
          <ReportKpi label="Open Now" value={String(s?.open ?? 0)} />
          <ReportKpi label="Critical" value={String(s?.critical ?? 0)} />
        </div>
        <p className="text-sm text-text-secondary">
          Average resolution time: {s?.avgResolutionHours?.toFixed(1) ?? "0"} hours.
          Resolution rate: {(s?.createdInRange ?? 0) > 0 ? Math.round(((s?.resolvedInRange ?? 0) / (s?.createdInRange ?? 1)) * 100) : 0}%.
        </p>
      </div>

      {/* Projects summary */}
      <div className="border-t border-ice pt-6">
        <h3 className="font-semibold text-base text-text-primary mb-3">Projects</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          <ReportKpi label="Total" value={String(projects.length)} />
          <ReportKpi label="On Track" value={String(projects.filter(p => p.status === "On Track").length)} />
          <ReportKpi label="At Risk" value={String(projects.filter(p => p.status === "At Risk").length)} />
          <ReportKpi label="Delayed" value={String(projects.filter(p => p.status === "Delayed").length)} />
        </div>
        {projects.length > 0 && (
          <div className="space-y-2 mt-4">
            {projects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-text-primary">{p.name} <span className="text-text-muted">({p.clientName})</span></span>
                <span className="text-text-secondary">{p.progress}% — {p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ice-30/50 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-lg text-navy mt-0.5">{value}</p>
    </div>
  );
}
