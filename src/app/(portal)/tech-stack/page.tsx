"use client";

import {
  DesktopIcon,
  CloudIcon,
  StackIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XCircleIcon,
  WifiHighIcon,
} from "@phosphor-icons/react";
import { useTechStack } from "@/hooks/use-tech-stack";
import { useClientFilter } from "@/hooks/use-client-filter";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { cn } from "@/lib/utils";

const statusColors: Record<string, { icon: typeof CheckCircleIcon; color: string; bg: string }> = {
  Active: { icon: CheckCircleIcon, color: "text-success", bg: "bg-success-tint" },
  Online: { icon: CheckCircleIcon, color: "text-success", bg: "bg-success-tint" },
  "Expiring Soon": { icon: WarningCircleIcon, color: "text-warning", bg: "bg-warning-tint" },
  Expired: { icon: XCircleIcon, color: "text-error", bg: "bg-error-tint" },
  Offline: { icon: XCircleIcon, color: "text-error", bg: "bg-error-tint" },
};

export default function TechStackPage() {
  const { clientId, clientName, isFiltered } = useClientFilter();
  const { data: rawData, isLoading, error } = useTechStack(clientId ?? undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as any;
  const software: any[] = data?.software ?? [];
  const infrastructure: any[] = data?.infrastructure ?? [];
  const cloud: any[] = data?.cloud ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tech Stack"
        subtitle={isFiltered ? `Tech stack for ${clientName}` : "Software, infrastructure, and cloud services across all clients"}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={<StackIcon size={20} weight="light" />}
          value={String(stats?.software.total ?? 0)}
          label="Software Subscriptions"
          iconBgClass="bg-blue-10"
          iconColorClass="text-blue"
          index={0}
        />
        <KpiCard
          icon={<DesktopIcon size={20} weight="light" />}
          value={String(stats?.infrastructure.total ?? 0)}
          label="Infrastructure Devices"
          iconBgClass="bg-success-tint"
          iconColorClass="text-success"
          index={1}
        />
        <KpiCard
          icon={<CloudIcon size={20} weight="light" />}
          value={String(stats?.cloud.total ?? 0)}
          label="Cloud Services"
          iconBgClass="bg-blue-10"
          iconColorClass="text-blue"
          index={2}
        />
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm text-text-muted">Loading tech stack data...</div>
      )}
      {error && (
        <div className="text-center py-12 text-sm text-error">Failed to load tech stack.</div>
      )}

      {/* Software Subscriptions */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
            Software Subscriptions
          </h3>
        </div>
        {software.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Software</Th><Th>Client</Th><Th>Licenses</Th><Th>Cost/mo</Th><Th>Renewal</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {software.map((s: any) => {
                  const st = statusColors[s.status] ?? statusColors.Active;
                  return (
                    <tr key={s.id} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                      <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{s.name}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.clientName}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.licenseUsed ?? 0}/{s.licenseCount ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.costPerMonth ? `$${s.costPerMonth.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.renewalDate ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
                          <st.icon size={12} weight="fill" />
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No software subscriptions found. Data will appear once synced from SharePoint.</p>
          </div>
        )}
      </div>

      {/* Infrastructure */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
            Infrastructure Devices
          </h3>
        </div>
        {infrastructure.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Device</Th><Th>Client</Th><Th>Type</Th><Th>Location</Th><Th>Status</Th><Th>Last Seen</Th>
                </tr>
              </thead>
              <tbody>
                {infrastructure.map((i: any) => {
                  const st = statusColors[i.status] ?? statusColors.Online;
                  return (
                    <tr key={i.id} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                      <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{i.name}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{i.clientName}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary capitalize">{i.deviceType ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{i.location ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
                          <st.icon size={12} weight="fill" />
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-muted">{i.lastSeen ? new Date(i.lastSeen).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No infrastructure devices found. Data will appear once synced from Atera.</p>
          </div>
        )}
      </div>

      {/* Cloud Services */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
            Cloud Services
          </h3>
        </div>
        {cloud.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Service</Th><Th>Client</Th><Th>Provider</Th><Th>Tier</Th><Th>Usage</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {cloud.map((c: any) => {
                  const st = statusColors[c.status] ?? statusColors.Active;
                  return (
                    <tr key={c.id} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                      <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{c.name}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.clientName}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.provider ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.tier ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.usagePercent != null ? `${c.usagePercent}%` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
                          <st.icon size={12} weight="fill" />
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No cloud services found. Data will appear once synced from SharePoint.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3 first:pl-6">{children}</th>;
}
