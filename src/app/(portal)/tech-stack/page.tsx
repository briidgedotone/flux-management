"use client";

import { useState } from "react";
import {
  DesktopIcon, CloudIcon, StackIcon,
  CheckCircleIcon, WarningCircleIcon, XCircleIcon,
  PlusIcon, TrashIcon, CaretDownIcon, CaretUpIcon,
} from "@phosphor-icons/react";
import { useTechStack, useCreateSoftware, useDeleteSoftware, useCreateCloud, useDeleteCloud } from "@/hooks/use-tech-stack";
import { useClients } from "@/hooks/use-clients";
import { useClientFilter } from "@/hooks/use-client-filter";
import { usePermissions } from "@/hooks/use-permissions";
import { KpiCard } from "@/components/shared/kpi-card";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, { color: string; bg: string }> = {
  Active: { color: "text-success", bg: "bg-success-tint" },
  Online: { color: "text-success", bg: "bg-success-tint" },
  "Expiring Soon": { color: "text-warning", bg: "bg-warning/10" },
  Expired: { color: "text-error", bg: "bg-error/10" },
  Offline: { color: "text-error", bg: "bg-error/10" },
};

export default function TechStackPage() {
  const { clientId, clientName, isFiltered } = useClientFilter();
  const perms = usePermissions();
  const [showSoftwareForm, setShowSoftwareForm] = useState(false);
  const [showCloudForm, setShowCloudForm] = useState(false);
  const [infraLimit, setInfraLimit] = useState(25);

  const { data: rawData, isLoading, error } = useTechStack(clientId ?? undefined);
  const data = rawData as any;
  const software: any[] = data?.software ?? [];
  const infrastructure: any[] = data?.infrastructure ?? [];
  const cloud: any[] = data?.cloud ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={<StackIcon size={20} weight="light" />} value={String(stats?.software.total ?? 0)} label="Software" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={0} />
        <KpiCard icon={<DesktopIcon size={20} weight="light" />} value={String(stats?.infrastructure.total ?? 0)} label="Devices" iconBgClass="bg-success-tint" iconColorClass="text-success" index={1} />
        <KpiCard icon={<CloudIcon size={20} weight="light" />} value={String(stats?.cloud.total ?? 0)} label="Cloud Services" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={2} />
      </div>

      {isLoading && <div className="text-center py-12 text-sm text-text-muted">Loading...</div>}
      {error && <div className="text-center py-12 text-sm text-error">Failed to load tech stack.</div>}

      {/* Software */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Software Subscriptions</h3>
          {perms.canEditTechStack && (
            <button onClick={() => setShowSoftwareForm(!showSoftwareForm)} className="flex items-center gap-1.5 text-xs font-medium text-blue hover:text-blue-light transition-colors">
              <PlusIcon size={13} weight="bold" /> Add
            </button>
          )}
        </div>
        {showSoftwareForm && <AddSoftwareForm onClose={() => setShowSoftwareForm(false)} />}
        {software.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-t border-ice/60">
                <Th className="pl-6">Software</Th>
                <Th>Client</Th>
                <Th>Licenses</Th>
                <Th>Status</Th>
                <Th className="w-10">{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {software.map((s: any) => (
                <SoftwareRow key={s.id} s={s} />
              ))}
            </tbody>
          </table>
        ) : !isLoading ? (
          <p className="px-6 pb-6 text-sm text-text-muted">No software subscriptions. Use "Add" to add entries or data will appear after sync.</p>
        ) : null}
      </div>

      {/* Infrastructure */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">
            Infrastructure Devices
            {infrastructure.length > 0 && <span className="text-[12px] font-normal text-text-muted ml-2">({infrastructure.length})</span>}
          </h3>
        </div>
        {infrastructure.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice/60">
                  <Th className="pl-6">Device</Th>
                  <Th>Client</Th>
                  <Th>Type</Th>
                  <Th>Model</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {infrastructure.slice(0, infraLimit).map((i: any) => {
                  const st = statusBadge[i.status] ?? statusBadge.Online;
                  return (
                    <tr key={i.id} className="border-t border-ice/40 hover:bg-blue-10/30 transition-colors">
                      <td className="pl-6 pr-4 py-3 text-[13px] font-medium text-text-primary">{i.name}</td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{i.clientName}</td>
                      <td className="px-4 py-3 text-[12px] text-text-secondary capitalize">{i.deviceType ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-text-muted">{i.model ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", i.status === "Online" ? "bg-success" : "bg-error")} />
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {infrastructure.length > infraLimit && (
              <button onClick={() => setInfraLimit(infraLimit + 50)}
                className="w-full py-3 text-xs font-medium text-blue hover:bg-blue-10/30 transition-colors border-t border-ice/40 flex items-center justify-center gap-1">
                <CaretDownIcon size={12} weight="bold" /> Show more ({infrastructure.length - infraLimit} remaining)
              </button>
            )}
            {infraLimit > 25 && (
              <button onClick={() => setInfraLimit(25)}
                className="w-full py-3 text-xs font-medium text-text-muted hover:bg-ice-30/50 transition-colors border-t border-ice/40 flex items-center justify-center gap-1">
                <CaretUpIcon size={12} weight="bold" /> Show less
              </button>
            )}
          </>
        ) : !isLoading ? (
          <p className="px-6 pb-6 text-sm text-text-muted">No devices found. Data will appear once synced from Atera.</p>
        ) : null}
      </div>

      {/* Cloud Services */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Cloud Services</h3>
          {perms.canEditTechStack && (
            <button onClick={() => setShowCloudForm(!showCloudForm)} className="flex items-center gap-1.5 text-xs font-medium text-blue hover:text-blue-light transition-colors">
              <PlusIcon size={13} weight="bold" /> Add
            </button>
          )}
        </div>
        {showCloudForm && <AddCloudForm onClose={() => setShowCloudForm(false)} />}
        {cloud.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-t border-ice/60">
                <Th className="pl-6">Service</Th>
                <Th>Client</Th>
                <Th>Provider</Th>
                <Th>Tier</Th>
                <Th>Status</Th>
                <Th className="w-10">{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {cloud.map((c: any) => (
                <CloudRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        ) : !isLoading ? (
          <p className="px-6 pb-6 text-sm text-text-muted">No cloud services. Use "Add" to add entries.</p>
        ) : null}
      </div>
    </div>
  );
}

function SoftwareRow({ s }: { s: any }) {
  const deleteMutation = useDeleteSoftware();
  const perms = usePermissions();
  const st = statusBadge[s.status] ?? statusBadge.Active;
  const isManual = !s.source || s.source === "manual";

  return (
    <tr className="border-t border-ice/40 hover:bg-blue-10/30 transition-colors group">
      <td className="pl-6 pr-4 py-3 text-[13px] font-medium text-text-primary">{s.name}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{s.clientName}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary tabular-nums">{s.licenseUsed ?? 0}/{s.licenseCount ?? "—"}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
          {s.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {isManual && perms.canEditTechStack && (
          <button onClick={() => deleteMutation.mutate(s.id)} className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100">
            <TrashIcon size={14} weight="light" />
          </button>
        )}
      </td>
    </tr>
  );
}

function CloudRow({ c }: { c: any }) {
  const deleteMutation = useDeleteCloud();
  const perms = usePermissions();
  const st = statusBadge[c.status] ?? statusBadge.Active;

  return (
    <tr className="border-t border-ice/40 hover:bg-blue-10/30 transition-colors group">
      <td className="pl-6 pr-4 py-3 text-[13px] font-medium text-text-primary">{c.name}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.clientName}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{c.provider ?? "—"}</td>
      <td className="px-4 py-3 text-[12px] text-text-muted">{c.tier ?? "—"}</td>
      <td className="px-4 py-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", st.color, st.bg)}>
          {c.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {perms.canEditTechStack && (
          <button onClick={() => deleteMutation.mutate(c.id)} className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100">
            <TrashIcon size={14} weight="light" />
          </button>
        )}
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
      organizationId: form.organizationId, name: form.name,
      licenseCount: form.licenseCount ? Number(form.licenseCount) : undefined,
      costPerMonth: form.costPerMonth ? Number(form.costPerMonth) : undefined,
      renewalDate: form.renewalDate || undefined,
      status: form.status as "Active" | "Expiring Soon" | "Expired",
    }, { onSuccess: () => { setForm({ organizationId: "", name: "", licenseCount: "", costPerMonth: "", renewalDate: "", status: "Active" }); onClose(); } });
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-4 border-t border-ice/60 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required className="h-9 px-3 text-xs rounded-lg border border-ice bg-white">
          <option value="">Client *</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Software name *" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.licenseCount} onChange={(e) => setForm({ ...form, licenseCount: e.target.value })} type="number" placeholder="Licenses" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} type="date" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <div className="flex gap-2">
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-4 text-xs font-medium bg-blue text-white rounded-lg transition-colors disabled:opacity-50">Add</button>
          <button type="button" onClick={onClose} className="h-9 px-3 text-xs text-text-muted">Cancel</button>
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
      organizationId: form.organizationId, name: form.name,
      provider: form.provider || undefined, tier: form.tier || undefined,
      status: form.status as "Active" | "Expiring Soon" | "Expired",
    }, { onSuccess: () => { setForm({ organizationId: "", name: "", provider: "", tier: "", status: "Active" }); onClose(); } });
  };

  return (
    <form onSubmit={handleSubmit} className="px-6 pb-4 border-t border-ice/60 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <select value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} required className="h-9 px-3 text-xs rounded-lg border border-ice bg-white">
          <option value="">Client *</option>
          {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Service name *" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Provider" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="Tier" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <div className="flex gap-2">
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-4 text-xs font-medium bg-blue text-white rounded-lg transition-colors disabled:opacity-50">Add</button>
          <button type="button" onClick={onClose} className="h-9 px-3 text-xs text-text-muted">Cancel</button>
        </div>
      </div>
    </form>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3", className)}>{children}</th>;
}
