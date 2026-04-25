"use client";

import { useTicketAnalyticsReport } from "@/hooks/use-reports";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";

const priorityColors: Record<string, string> = {
  critical: "#C53030",
  high: "#B8860B",
  medium: "#15549D",
  low: "#8896A6",
};

export function TicketAnalyticsReport() {
  const { data: report, isLoading } = useTicketAnalyticsReport();

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Loading ticket analytics...</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = report as any;
  const total = r?.total ?? 0;
  const created = r?.createdInRange ?? 0;
  const resolved = r?.resolvedInRange ?? 0;
  const avgHours = r?.avgResolutionHours ?? 0;
  const priority = r?.priorityBreakdown ?? { critical: 0, high: 0, medium: 0, low: 0 };

  const maxPriority = Math.max(priority.critical, priority.high, priority.medium, priority.low, 1);

  const pieData = [
    { name: "Critical", value: priority.critical, color: priorityColors.critical },
    { name: "High", value: priority.high, color: priorityColors.high },
    { name: "Medium", value: priority.medium, color: priorityColors.medium },
    { name: "Low", value: priority.low, color: priorityColors.low },
  ].filter((d: { value: number }) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiMini label="Total Tickets" value={String(total)} sub="all time" />
        <KpiMini label="Created (30d)" value={String(created)} sub="last 30 days" />
        <KpiMini label="Resolved (30d)" value={String(resolved)} sub="last 30 days" />
        <KpiMini label="Avg Resolution" value={`${avgHours.toFixed(1)}h`} sub="hours" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority pie */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                {pieData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#002B4D", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-text-secondary">{d.name}: {d.value} ({total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority bars */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-5">Priority Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: "Critical", value: priority.critical, color: priorityColors.critical },
              { label: "High", value: priority.high, color: priorityColors.high },
              { label: "Medium", value: priority.medium, color: priorityColors.medium },
              { label: "Low", value: priority.low, color: priorityColors.low },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-text-primary">{p.label}</span>
                  <span className="text-[13px] text-text-secondary">
                    {p.value} <span className="text-text-muted">({total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%)</span>
                  </span>
                </div>
                <div className="h-2.5 bg-ice-30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${maxPriority > 0 ? (p.value / maxPriority) * 100 : 0}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">Resolution Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBox label="Resolution Rate" value={created > 0 ? `${Math.round((resolved / created) * 100)}%` : "—"} desc="resolved / created (30d)" />
          <StatBox label="Avg Resolution" value={`${avgHours.toFixed(1)}h`} desc="hours to resolve" />
          <StatBox label="Critical Ratio" value={total > 0 ? `${((priority.critical / total) * 100).toFixed(1)}%` : "—"} desc="of all tickets" />
          <StatBox label="High Priority" value={total > 0 ? `${(((priority.critical + priority.high) / total) * 100).toFixed(1)}%` : "—"} desc="critical + high" />
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

function StatBox({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="p-4 border border-ice/50 rounded-xl">
      <p className="text-[11px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-lg text-navy mt-1">{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
    </div>
  );
}
