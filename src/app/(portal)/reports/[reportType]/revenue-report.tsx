"use client";

import { useRevenueReport } from "@/hooks/use-reports";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const healthColor: Record<string, string> = {
  healthy: "text-success bg-success-tint",
  "at-risk": "text-warning bg-warning-tint",
  critical: "text-error bg-error-tint",
};

export function RevenueReport() {
  const { data: report, isLoading } = useRevenueReport("30d");

  if (isLoading) return <div className="text-center py-12 text-sm text-text-muted">Loading revenue data...</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = report as any;
  const clients = r?.clients ?? [];
  const totalRevenue = r?.totalRevenue ?? 0;
  const topClient = clients[0];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiMini label="Total Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} trend={`${clients.length} clients`} />
        <KpiMini label="Active Clients" value={String(clients.length)} trend={`${clients.filter((c: any) => c.contractStatus === "active").length} active`} />
        {topClient && <KpiMini label="Top Client" value={topClient.clientName} trend={`$${topClient.monthlyRevenue.toLocaleString()}/mo`} />}
      </div>

      {/* Revenue by client bars */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-5">
          Revenue by Client
        </h3>
        <div className="space-y-3">
          {clients.map((client: any) => {
            const maxRevenue = topClient?.monthlyRevenue || 1;
            const pct = (client.monthlyRevenue / maxRevenue) * 100;
            return (
              <div key={client.clientId} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-text-primary font-medium truncate max-w-[180px]">
                    {client.clientName}
                  </span>
                  <span className="text-[13px] font-semibold text-text-primary">
                    ${client.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 bg-ice-30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue to-blue-light transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client revenue table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
            Client Revenue Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-ice">
                <Th>Client</Th>
                <Th>Monthly Revenue</Th>
                <Th>Share</Th>
                <Th>Contract</Th>
                <Th>Health</Th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.clientId} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                  <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{c.clientName}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-text-primary">${c.monthlyRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{totalRevenue > 0 ? ((c.monthlyRevenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize",
                      c.contractStatus === "active" ? "text-success bg-success-tint" : "text-warning bg-warning-tint"
                    )}>
                      {c.contractStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize", healthColor[c.healthScore] ?? "text-text-secondary bg-ice-30")}>
                      {c.healthScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">{label}</p>
      <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary mt-1">{value}</p>
      <p className="text-[12px] text-text-secondary font-medium mt-0.5">{trend}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3 first:pl-6">{children}</th>;
}
