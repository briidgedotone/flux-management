"use client";

import { useState } from "react";
import {
  DesktopIcon,
  CloudIcon,
  StackIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useTechStack, useCreateSoftware, useDeleteSoftware, useCreateCloud, useDeleteCloud } from "@/hooks/use-tech-stack";
import { useClients } from "@/hooks/use-clients";
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
  const [showSoftwareForm, setShowSoftwareForm] = useState(false);
  const [showCloudForm, setShowCloudForm] = useState(false);

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
        <KpiCard icon={<StackIcon size={20} weight="light" />} value={String(stats?.software.total ?? 0)} label="Software Subscriptions" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={0} />
        <KpiCard icon={<DesktopIcon size={20} weight="light" />} value={String(stats?.infrastructure.total ?? 0)} label="Infrastructure Devices" iconBgClass="bg-success-tint" iconColorClass="text-success" index={1} />
        <KpiCard icon={<CloudIcon size={20} weight="light" />} value={String(stats?.cloud.total ?? 0)} label="Cloud Services" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={2} />
      </div>

      {isLoading && <div className="text-center py-12 text-sm text-text-muted">Loading tech stack data...</div>}
      {error && <div className="text-center py-12 text-sm text-error">Failed to load tech stack.</div>}

      {/* Software Subscriptions */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">Software Subscriptions</h3>
          <button onClick={() => setShowSoftwareForm(!showSoftwareForm)} className="flex items-center gap-1.5 text-xs font-medium text-blue hover:text-blue-light transition-colors">
            <PlusIcon size={14} weight="bold" /> Add Software
          </button>
        </div>
        {showSoftwareForm && <AddSoftwareForm onClose={() => setShowSoftwareForm(false)} />}
        {software.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Software</Th><Th>Client</Th><Th>Licenses</Th><Th>Cost/mo</Th><Th>Renewal</Th><Th>Status</Th><Th>Source</Th><Th>{" "}</Th>
                </tr>
              </thead>
              <tbody>
                {software.map((s: any) => (
                  <SoftwareRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
        ) : !isLoading ? (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No software subscriptions found. Use "Add Software" to manually add entries, or data will appear after sync.</p>
          </div>
        ) : null}
      </div>

      {/* Infrastructure */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">Infrastructure Devices</h3>
        </div>
        {infrastructure.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Device</Th><Th>Client</Th><Th>Type</Th><Th>OS</Th><Th>Model</Th><Th>Status</Th><Th>Last Seen</Th>
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
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{i.os ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{i.model ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
                          <st.icon size={12} weight="fill" /> {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-muted">{i.lastSeen ? new Date(i.lastSeen).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : !isLoading ? (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No infrastructure devices found. Data will appear once synced from Atera.</p>
          </div>
        ) : null}
      </div>

      {/* Cloud Services */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">Cloud Services</h3>
          <button onClick={() => setShowCloudForm(!showCloudForm)} className="flex items-center gap-1.5 text-xs font-medium text-blue hover:text-blue-light transition-colors">
            <PlusIcon size={14} weight="bold" /> Add Cloud Service
          </button>
        </div>
        {showCloudForm && <AddCloudForm onClose={() => setShowCloudForm(false)} />}
        {cloud.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <Th>Service</Th><Th>Client</Th><Th>Provider</Th><Th>Tier</Th><Th>Usage</Th><Th>Status</Th><Th>{" "}</Th>
                </tr>
              </thead>
              <tbody>
                {cloud.map((c: any) => (
                  <CloudRow key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        ) : !isLoading ? (
          <div className="px-6 pb-6">
            <p className="text-sm text-text-muted">No cloud services found. Use "Add Cloud Service" to manually add entries.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SoftwareRow({ s }: { s: any }) {
  const deleteMutation = useDeleteSoftware();
  const st = statusColors[s.status] ?? statusColors.Active;
  const isManual = s.source === "manual" || !s.source;

  return (
    <tr className="border-t border-ice hover:bg-ice-30/50 transition-colors">
      <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{s.name}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.clientName}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.licenseUsed ?? 0}/{s.licenseCount ?? "—"}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.costPerMonth ? `$${s.costPerMonth.toLocaleString()}` : "—"}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.renewalDate ?? "—"}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
          <st.icon size={12} weight="fill" /> {s.status}
        </span>
      </td>
      <td className="px-4 py-3 text-[11px] text-text-muted">{s.source ?? "manual"}</td>
      <td className="px-4 py-3">
        {isManual && (
          <button onClick={() => deleteMutation.mutate(s.id)} className="text-text-muted hover:text-error transition-colors" title="Delete">
            <TrashIcon size={14} weight="light" />
          </button>
        )}
      </td>
    </tr>
  );
}

function CloudRow({ c }: { c: any }) {
  const deleteMutation = useDeleteCloud();
  const st = statusColors[c.status] ?? statusColors.Active;

  return (
    <tr className="border-t border-ice hover:bg-ice-30/50 transition-colors">
      <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{c.name}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.clientName}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.provider ?? "—"}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.tier ?? "—"}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.usagePercent != null ? `${c.usagePercent}%` : "—"}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
          <st.icon size={12} weight="fill" /> {c.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <button onClick={() => deleteMutation.mutate(c.id)} className="text-text-muted hover:text-error transition-colors" title="Delete">
          <TrashIcon size={14} weight="light" />
        </button>
      </td>
    </tr>
  );
}

function AddSoftwareForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateSoftware();
  const { data: clientsResp } = useClients({ limit: 50 });
  const clients: any[] = (clientsResp as any)?.data ?? [];
  const [form, setForm] = useState({ organizationId: "", name: "", licenseCount: "", costPerMonth: "", renewalDate: "", status: "Active" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationId || !form.name) return;
    createMutation.mutate({
      organizationId: form.organizationId,
      name: form.name,
      licenseCount: form.licenseCount ? Number(form.licenseCount) : undefined,
      costPerMonth: form.costPerMonth ? Number(form.costPerMonth) : undefined,
      renewalDate: form.renewalDate || undefined,
      status: form.status as "Active" | "Expiring Soon" | "Expired",
    }, {
      onSuccess: () => {
        setForm({ organizationId: "", name: "", licenseCount: "", costPerMonth: "", renewalDate: "", status: "Active" });
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-5 border-t border-ice pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required className="col-span-2 sm:col-span-1 h-9 px-3 text-xs rounded-lg border border-ice bg-white">
          <option value="">Client *</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Software name *" className="col-span-2 sm:col-span-1 h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.licenseCount} onChange={(e) => setForm({ ...form, licenseCount: e.target.value })} type="number" placeholder="Licenses" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.costPerMonth} onChange={(e) => setForm({ ...form, costPerMonth: e.target.value })} type="number" step="0.01" placeholder="Cost/mo" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} type="date" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <div className="flex gap-2">
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-4 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy-95 transition-colors disabled:opacity-50">
            {createMutation.isPending ? "Adding..." : "Add"}
          </button>
          <button type="button" onClick={onClose} className="h-9 px-3 text-xs text-text-muted hover:text-text-primary transition-colors">Cancel</button>
        </div>
      </div>
    </form>
  );
}

function AddCloudForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateCloud();
  const { data: clientsResp } = useClients({ limit: 50 });
  const clients: any[] = (clientsResp as any)?.data ?? [];
  const [form, setForm] = useState({ organizationId: "", name: "", provider: "", tier: "", status: "Active" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationId || !form.name) return;
    createMutation.mutate({
      organizationId: form.organizationId,
      name: form.name,
      provider: form.provider || undefined,
      tier: form.tier || undefined,
      status: form.status as "Active" | "Expiring Soon" | "Expired",
    }, {
      onSuccess: () => {
        setForm({ organizationId: "", name: "", provider: "", tier: "", status: "Active" });
        onClose();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-5 border-t border-ice pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required className="h-9 px-3 text-xs rounded-lg border border-ice bg-white">
          <option value="">Client *</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Service name *" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Provider" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="Tier" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <div className="flex gap-2">
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-4 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy-95 transition-colors disabled:opacity-50">
            {createMutation.isPending ? "Adding..." : "Add"}
          </button>
          <button type="button" onClick={onClose} className="h-9 px-3 text-xs text-text-muted hover:text-text-primary transition-colors">Cancel</button>
        </div>
      </div>
    </form>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3 first:pl-6">{children}</th>;
}
