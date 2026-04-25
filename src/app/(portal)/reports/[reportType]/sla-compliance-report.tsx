"use client";

import { useSlaReport } from "@/hooks/use-reports";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

function getComplianceColor(value: number): { stroke: string; fill: string; label: string; bg: string } {
  if (value >= 95) return { stroke: "#0D7C5F", fill: "#E6F5F0", label: "text-success", bg: "bg-success-tint" };
  if (value >= 90) return { stroke: "#B8860B", fill: "#FDF5E6", label: "text-warning", bg: "bg-warning-tint" };
  return { stroke: "#C53030", fill: "#FDE8E8", label: "text-error", bg: "bg-error-tint" };
}

export function SlaComplianceReport() {
  const { data: report, isLoading } = useSlaReport("30d");

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Loading SLA data...</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = report as any;
  const clients: any[] = r?.clients ?? [];
  const avgSla = clients.length > 0 ? Math.round(clients.reduce((s: number, c: any) => s + c.slaPercent, 0) / clients.length) : 0;
  const atRiskClients = clients.filter((c: any) => c.slaPercent < 90);
  const topPerformer = [...clients].sort((a: any, b: any) => b.slaPercent - a.slaPercent)[0];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiMini label="Average SLA" value={`${avgSla}%`} sub={avgSla >= 95 ? "Excellent" : "Needs attention"} accent={avgSla >= 95} />
        <KpiMini label="At-Risk Clients" value={String(atRiskClients.length)} sub="below 90%" accent={false} />
        {topPerformer && <KpiMini label="Best Performer" value={topPerformer.clientName} sub={`${topPerformer.slaPercent}%`} accent />}
        <KpiMini label="Total Clients" value={String(clients.length)} sub="monitored" accent />
      </div>

      {/* Radial gauges */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-5">
          Client SLA Compliance (% resolved within 24h)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {clients.map((client: any) => (
            <SlaGauge key={client.clientId} name={client.clientName} value={client.slaPercent} />
          ))}
        </div>
      </div>

      {/* All clients compliance bars */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-5">
          All Clients Compliance
        </h3>
        <div className="space-y-3">
          {clients.map((c: any) => {
            const colors = getComplianceColor(c.slaPercent);
            return (
              <div key={c.clientId} className="flex items-center gap-4">
                <span className="text-[13px] font-medium text-text-primary min-w-[160px] truncate">{c.clientName}</span>
                <div className="flex-1 h-2.5 bg-ice-30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${c.slaPercent}%`, backgroundColor: colors.stroke }} />
                </div>
                <span className={cn("text-[13px] font-semibold w-14 text-right", colors.label)}>{c.slaPercent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">SLA Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-ice">
                <Th>Client</Th><Th>SLA Target</Th><Th>SLA Actual</Th><Th>Total Tickets</Th><Th>Within 24h</Th><Th>Avg Resolution (h)</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => {
                const colors = getComplianceColor(c.slaPercent);
                return (
                  <tr key={c.clientId} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                    <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{c.clientName}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{c.slaTarget}%</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold", colors.label, colors.bg)}>{c.slaPercent}%</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{c.totalTickets}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-text-primary">{c.withinSla}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{c.avgResolutionHours?.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SlaGauge({ name, value }: { name: string; value: number }) {
  const colors = getComplianceColor(value);
  const data = [{ name: "value", value }, { name: "empty", value: 100 - value }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[80px] h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={38} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
              <Cell fill={colors.stroke} /><Cell fill="#F4F5F7" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-[family-name:var(--font-aptos)] font-bold text-sm", colors.label)}>{value}%</span>
        </div>
      </div>
      <p className="text-[11px] text-text-secondary mt-1.5 text-center leading-tight max-w-[80px] truncate">{name}</p>
    </div>
  );
}

function KpiMini({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary mt-1">{value}</p>
      <p className={cn("text-[12px] font-medium mt-0.5", accent ? "text-success" : "text-warning")}>{sub}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3 first:pl-6">{children}</th>;
}
