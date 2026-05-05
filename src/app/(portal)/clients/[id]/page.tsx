"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Portal } from "@/components/shared/portal";
import {
  CaretLeftIcon, EnvelopeIcon, PhoneIcon, PencilSimpleIcon,
  TicketIcon, KanbanIcon, CheckCircleIcon, ClockIcon,
  CalendarBlankIcon, XIcon, CheckIcon,
} from "@phosphor-icons/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { KpiCard } from "@/components/shared/kpi-card";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import { useTickets } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/data/types";

type ClientTab = "tickets" | "projects";

const statusDotColor: Record<string, string> = {
  "On Track": "bg-success",
  "At Risk": "bg-warning",
  Delayed: "bg-error",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ClientTab>("tickets");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const clientId = params.id as string;
  const { data: client, isLoading, refetch } = useClient(clientId);
  const { data: ticketsResp } = useTickets({ clientId, limit: 50 });
  const { data: projectsResp } = useProjects({ clientId, limit: 50 });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-muted">Loading...</p></div>;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-text-muted">Client not found</p>
        <button onClick={() => router.push("/clients")} className="text-sm text-blue hover:underline mt-2">Back to Clients</button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  const clientTickets: any[] = ((ticketsResp as any)?.data as any[]) ?? [];
  const clientProjects: any[] = ((projectsResp as any)?.data as any[]) ?? [];
  const initials = c.companyName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => router.push("/clients")} className="flex items-center gap-1 text-sm text-text-secondary hover:text-blue transition-colors">
        <CaretLeftIcon size={16} weight="light" /> Back to Clients
      </button>

      {/* Header Card — Identity + Contact */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left: Identity */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
              <span className="text-[15px] font-bold text-navy">{initials}</span>
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] tracking-[-0.02em] text-text-primary leading-tight">
                {c.companyName}
              </h1>
              {c.industry && (
                <span className="inline-flex px-2 py-0.5 rounded-md bg-ice-30/80 text-[12px] font-medium text-text-secondary mt-1.5">
                  {c.industry}
                </span>
              )}
              {!c.hasProfile && (
                <p className="text-[11px] text-warning mt-1.5">Profile not set up — click edit to add details</p>
              )}
            </div>
          </div>

          {/* Right: Contact Grid + Edit */}
          <div className="flex items-start gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-0.5">Contact</p>
                <p className="text-[13px] text-text-primary">{c.primaryContact?.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-0.5">Email</p>
                <p className="text-[13px] text-text-primary flex items-center gap-1.5">
                  <EnvelopeIcon size={13} weight="light" className="text-text-muted flex-shrink-0" />
                  {c.primaryContact?.email || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-0.5">Phone</p>
                <p className="text-[13px] text-text-primary flex items-center gap-1.5">
                  <PhoneIcon size={13} weight="light" className="text-text-muted flex-shrink-0" />
                  {c.primaryContact?.phone || "Not set"}
                </p>
              </div>
            </div>
            <button onClick={() => setEditOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ice-30 transition-colors shrink-0"
              title="Edit Profile">
              <PencilSimpleIcon size={16} weight="light" className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<TicketIcon size={20} weight="light" />} value={String(c.openTickets ?? 0)} label="Open Tickets" iconBgClass="bg-error/10" iconColorClass="text-error" index={0} />
        <KpiCard icon={<CheckCircleIcon size={20} weight="light" />} value={String(c.resolvedTickets ?? 0)} label="Resolved (30d)" iconBgClass="bg-success-tint" iconColorClass="text-success" index={1} />
        <KpiCard icon={<ClockIcon size={20} weight="light" />} value={c.avgResolutionHours ? `${Math.round(c.avgResolutionHours)}h` : "—"} label="Avg Resolution" iconBgClass="bg-warning/10" iconColorClass="text-warning" index={2} />
        <KpiCard icon={<KanbanIcon size={20} weight="light" />} value={String(c.activeProjects ?? 0)} label="Active Projects" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={3} />
      </div>

      {/* Tab Bar */}
      <div className="border-b border-ice">
        <div className="flex gap-6">
          {([{ key: "tickets" as const, label: "Tickets" }, { key: "projects" as const, label: "Projects" }]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key ? "text-blue" : "text-text-muted hover:text-text-secondary"
              )}>
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
          {clientTickets.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-12">No tickets for this client.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="h-11">
                  {["Ticket #", "Subject", "Status", "Priority", "Assigned To", "Updated"].map((h) => (
                    <th key={h} className="px-5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted border-b border-ice/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientTickets.map((t: any) => (
                  <tr key={t.id} onClick={() => setSelectedTicket(t as unknown as Ticket)}
                    className="h-[52px] border-b border-ice/40 last:border-0 hover:bg-blue-10/50 cursor-pointer transition-colors duration-150">
                    <td className="px-5"><span className="font-mono text-[13px] text-blue">{t.ticketNumber ?? t.id}</span></td>
                    <td className="px-5 text-[13px] text-text-primary max-w-[260px] truncate">{t.subject}</td>
                    <td className="px-5"><StatusBadge status={t.status} /></td>
                    <td className="px-5"><PriorityIndicator priority={t.priority} /></td>
                    <td className="px-5 text-xs text-text-secondary">{t.assignedToName ?? "—"}</td>
                    <td className="px-5 text-xs text-text-muted whitespace-nowrap">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div>
          {clientProjects.length === 0 ? (
            <p className="text-sm text-text-muted py-12 text-center">No projects for this client.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {clientProjects.map((p: any) => (
                <div key={p.id} onClick={() => router.push(`/projects/${p.id}`)}
                  className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 hover:shadow-level-2 hover:-translate-y-0.5 cursor-pointer transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-[family-name:var(--font-aptos)] font-semibold text-[14px] text-text-primary leading-snug">{p.name}</p>
                    <span className={cn("flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap",
                      p.status === "On Track" ? "text-success" : p.status === "At Risk" ? "text-warning" : "text-error"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", statusDotColor[p.status] ?? "bg-gray-400")} />
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-4 w-full bg-ice-50 rounded-full h-1.5">
                    <div className="bg-blue h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs text-text-muted">{p.tasksCompleted}/{p.totalTasks} tasks</span>
                    {p.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <CalendarBlankIcon size={11} weight="light" />{p.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Edit Slide-Over */}
      <ProfileSlideOver
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        client={c}
        clientId={clientId}
        onSaved={() => { refetch(); setEditOpen(false); }}
      />

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

/* ── Profile Edit Slide-Over ── */
function ProfileSlideOver({ isOpen, onClose, client, clientId, onSaved }: {
  isOpen: boolean; onClose: () => void; client: any; clientId: string; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    primaryContactName: client.primaryContact?.name ?? "",
    primaryContactEmail: client.primaryContact?.email ?? "",
    primaryContactPhone: client.primaryContact?.phone ?? "",
    industry: client.industry ?? "",
    notes: client.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const updateClient = useUpdateClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClient.mutateAsync({ id: clientId, data: form });
      onSaved();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={onClose} />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white shadow-level-4 z-[71] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-ice flex-shrink-0">
              <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary">
                {client.hasProfile ? "Edit Client Profile" : "Set Up Profile"}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ice-30 flex items-center justify-center transition-colors">
                <XIcon size={18} weight="light" className="text-text-secondary" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <FormField label="Primary Contact Name" value={form.primaryContactName} onChange={(v) => setForm({ ...form, primaryContactName: v })} placeholder="e.g., Sarah Mitchell" />
              <FormField label="Email" value={form.primaryContactEmail} onChange={(v) => setForm({ ...form, primaryContactEmail: v })} placeholder="e.g., sarah@company.com" type="email" />
              <FormField label="Phone" value={form.primaryContactPhone} onChange={(v) => setForm({ ...form, primaryContactPhone: v })} placeholder="e.g., (555) 123-4567" />
              <FormField label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="e.g., Financial Services" />
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this client..."
                  rows={5}
                  className="w-full bg-white border border-ice rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-ice flex-shrink-0">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center justify-center gap-2 w-full h-10 bg-blue hover:bg-blue-light text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                <CheckIcon size={14} weight="bold" />
                {saving ? "Saving..." : client.hasProfile ? "Save Changes" : "Create Profile"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </Portal>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 bg-white border border-ice rounded-xl px-3 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
      />
    </div>
  );
}
