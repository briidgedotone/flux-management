"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CaretLeftIcon, EnvelopeIcon, PhoneIcon,
  TicketIcon, KanbanIcon, PencilSimpleIcon, CheckIcon, XIcon,
} from "@phosphor-icons/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { useClient, useUpdateClient } from "@/hooks/use-clients";
import { useTickets } from "@/hooks/use-tickets";
import { useProjects } from "@/hooks/use-projects";
import type { Ticket } from "@/data/types";

type ClientTab = "overview" | "tickets" | "projects" | "profile";

const tabItems: { id: ClientTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tickets", label: "Tickets" },
  { id: "projects", label: "Projects" },
  { id: "profile", label: "Profile" },
];

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
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  const clientTickets: any[] = ((ticketsResp as any)?.data as any[]) ?? [];
  const clientProjects: any[] = ((projectsResp as any)?.data as any[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <button onClick={() => router.push("/clients")} className="flex items-center gap-1 text-sm text-text-secondary hover:text-blue transition-colors">
        <CaretLeftIcon size={16} weight="light" /> Back to Clients
      </button>

      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] tracking-[-0.02em] text-text-primary">{c.companyName}</h1>
            {c.industry && <p className="text-sm text-text-secondary mt-0.5">{c.industry}</p>}
            {!c.hasProfile && (
              <p className="text-xs text-warning mt-1">Profile not set up yet — go to Profile tab to fill in details</p>
            )}
          </div>
        </div>

        {/* KPI Row — only PRD metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-ice-30/50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-text-muted mb-1">
              <TicketIcon size={16} weight="light" />
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium">Open Tickets</span>
            </div>
            <span className="font-[family-name:var(--font-aptos)] font-bold text-xl text-navy">{c.openTickets ?? 0}</span>
          </div>
          <div className="bg-ice-30/50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-text-muted mb-1">
              <KanbanIcon size={16} weight="light" />
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium">Active Projects</span>
            </div>
            <span className="font-[family-name:var(--font-aptos)] font-bold text-xl text-navy">{c.activeProjects ?? 0}</span>
          </div>
        </div>

        {/* Contact info */}
        {c.primaryContact?.name && (
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5"><EnvelopeIcon size={14} weight="light" />{c.primaryContact.email}</span>
            {c.primaryContact.phone && <span className="flex items-center gap-1.5"><PhoneIcon size={14} weight="light" />{c.primaryContact.phone}</span>}
          </div>
        )}
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
                      <span className="font-mono text-xs text-blue">{t.ticketNumber ?? t.id}</span>
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
                      <span className={`w-2 h-2 rounded-full ${statusDotColor[p.status] ?? "bg-gray-400"}`} />
                      <span className="text-xs text-text-secondary">{p.status}</span>
                    </div>
                    <div className="mt-2 w-full bg-ice-50 rounded-full h-1.5">
                      <div className="bg-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-text-muted mt-1 block">{p.tasksCompleted}/{p.totalTasks} tasks</span>
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
                    <td className="py-3 pr-4"><span className="font-mono text-sm text-blue">{t.ticketNumber ?? t.id}</span></td>
                    <td className="py-3 pr-4 text-sm text-text-primary max-w-[220px] truncate">{t.subject}</td>
                    <td className="py-3 pr-4"><StatusBadge status={t.status} /></td>
                    <td className="py-3 pr-4"><PriorityIndicator priority={t.priority} /></td>
                    <td className="py-3 pr-4 text-xs text-text-secondary">{t.assignedToName ?? ""}</td>
                    <td className="py-3 text-xs text-text-muted">{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ""}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {clientTickets.length === 0 && <p className="text-center text-sm text-text-muted py-8">No tickets for this client.</p>}
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clientProjects.length === 0 ? (
            <p className="text-sm text-text-muted col-span-2">No projects for this client.</p>
          ) : clientProjects.map((p) => (
            <div key={p.id as string} onClick={() => router.push(`/projects/${p.id}`)}
              className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 hover:shadow-level-2 cursor-pointer transition-all">
              <p className="font-[family-name:var(--font-aptos)] font-semibold text-sm text-text-primary">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusDotColor[p.status] ?? "bg-gray-400"}`} />
                <span className="text-xs text-text-secondary">{p.status}</span>
              </div>
              <div className="mt-3 w-full bg-ice-50 rounded-full h-1.5">
                <div className="bg-blue h-1.5 rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-xs text-text-muted mt-1 block">{p.tasksCompleted}/{p.totalTasks} tasks</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "profile" && (
        <ProfileTab client={c} clientId={clientId} onSaved={refetch} />
      )}

      <TicketSlideOver ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

function ProfileTab({ client, clientId, onSaved }: { client: any; clientId: string; onSaved: () => void }) {
  const [editing, setEditing] = useState(!client.hasProfile);
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
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">Client Profile</h3>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-blue hover:underline">
            <PencilSimpleIcon size={14} weight="light" /> Edit
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ProfileField label="Primary Contact" value={client.primaryContact?.name || "Not set"} />
          <ProfileField label="Email" value={client.primaryContact?.email || "Not set"} />
          <ProfileField label="Phone" value={client.primaryContact?.phone || "Not set"} />
          <ProfileField label="Industry" value={client.industry || "Not set"} />
        </div>
        {client.notes && (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted mb-1">Notes</p>
            <p className="text-sm text-text-primary whitespace-pre-line">{client.notes}</p>
          </div>
        )}
        {client.updatedAt && (
          <p className="text-xs text-text-muted mt-6">Last updated: {new Date(client.updatedAt).toLocaleString()}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
          {client.hasProfile ? "Edit Client Profile" : "Set Up Client Profile"}
        </h3>
        <div className="flex items-center gap-2">
          {client.hasProfile && (
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
              <XIcon size={14} weight="light" /> Cancel
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4 max-w-lg">
        <FormField label="Primary Contact Name" value={form.primaryContactName} onChange={(v) => setForm({ ...form, primaryContactName: v })} placeholder="e.g., Sarah Mitchell" />
        <FormField label="Email" value={form.primaryContactEmail} onChange={(v) => setForm({ ...form, primaryContactEmail: v })} placeholder="e.g., sarah@company.com" type="email" />
        <FormField label="Phone" value={form.primaryContactPhone} onChange={(v) => setForm({ ...form, primaryContactPhone: v })} placeholder="e.g., (555) 123-4567" />
        <FormField label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="e.g., Financial Services" />
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any notes about this client..."
            rows={4}
            className="w-full bg-white border border-ice rounded-xl px-3 py-2 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-5 bg-blue hover:bg-blue-light text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <CheckIcon size={14} weight="bold" />
          {saving ? "Saving..." : client.hasProfile ? "Save Changes" : "Create Profile"}
        </button>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted mb-1">{label}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-white border border-ice rounded-xl px-3 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
      />
    </div>
  );
}
