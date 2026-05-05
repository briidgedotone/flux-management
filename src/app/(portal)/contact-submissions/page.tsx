"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EnvelopeOpenIcon, CheckCircleIcon, ClockIcon, ChatCircleDotsIcon,
  BuildingsIcon, AtIcon, PhoneIcon, XIcon, CalendarBlankIcon,
} from "@phosphor-icons/react";
import { useContactSubmissions, useUpdateSubmission } from "@/hooks/use-contact-submissions";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue", bg: "bg-blue-10" },
  reviewed: { label: "Reviewed", color: "text-warning", bg: "bg-warning/10" },
  responded: { label: "Responded", color: "text-success", bg: "bg-success-tint" },
};

export default function ContactSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: rawData, isLoading } = useContactSubmissions({ status: statusFilter || undefined, limit: 50 });
  const resp = rawData as any;
  const submissions: any[] = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const selected = submissions.find((s: any) => s.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="border-b border-ice">
        <div className="flex gap-6">
          {[
            { key: "", label: "All", count: total },
            { key: "new", label: "New" },
            { key: "reviewed", label: "Reviewed" },
            { key: "responded", label: "Responded" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={cn("pb-3 text-sm font-medium transition-colors relative",
                statusFilter === tab.key ? "text-blue" : "text-text-muted hover:text-text-secondary"
              )}>
              {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
              {statusFilter === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="text-center py-16 text-sm text-text-muted">Loading...</div>}

      {/* Table */}
      {!isLoading && submissions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ice/60">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted pl-6 pr-4 py-3.5">Name</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Company</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Email</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Interest</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Status</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub: any) => {
                const cfg = statusConfig[sub.status] ?? statusConfig.new;
                return (
                  <tr key={sub.id} onClick={() => setSelectedId(sub.id)}
                    className={cn("border-t border-ice/40 cursor-pointer transition-colors duration-150",
                      sub.status === "new" ? "hover:bg-blue-10/30" : "hover:bg-ice-30/50"
                    )}>
                    <td className="pl-6 pr-4 py-3.5">
                      <span className={cn("text-[13px] font-medium", sub.status === "new" ? "text-text-primary" : "text-text-secondary")}>
                        {sub.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-secondary">{sub.company || "—"}</td>
                    <td className="px-4 py-3.5 text-[13px] text-text-secondary">{sub.email}</td>
                    <td className="px-4 py-3.5">
                      {sub.serviceInterest ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-ice-30/80 text-[11px] font-medium text-text-secondary">{sub.serviceInterest}</span>
                      ) : <span className="text-[13px] text-text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", cfg.color, cfg.bg)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full",
                          sub.status === "new" ? "bg-blue" : sub.status === "reviewed" ? "bg-warning" : "bg-success"
                        )} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-text-muted whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && submissions.length === 0 && (
        <div className="text-center py-20">
          <ChatCircleDotsIcon size={48} weight="light" className="text-text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary">No submissions</p>
          <p className="text-xs text-text-muted mt-1">{statusFilter ? `No leads with status "${statusFilter}".` : "Submissions will appear here when someone fills out the contact form."}</p>
        </div>
      )}

      {/* Detail Slide-Over */}
      <LeadSlideOver lead={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function LeadSlideOver({ lead, onClose }: { lead: any; onClose: () => void }) {
  const updateSubmission = useUpdateSubmission();
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    try { await updateSubmission.mutateAsync({ id: lead.id, status }); } finally { setUpdating(false); }
  };

  return (
    <AnimatePresence>
      {lead && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-white shadow-level-4 z-[61] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-ice flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary">{lead.name}</h2>
                {(() => {
                  const cfg = statusConfig[lead.status] ?? statusConfig.new;
                  return (
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.color, cfg.bg)}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-ice-30 flex items-center justify-center transition-colors">
                <XIcon size={18} weight="light" className="text-text-secondary" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Company" value={lead.company || "Not provided"} icon={<BuildingsIcon size={13} weight="light" />} />
                <InfoField label="Email" value={lead.email} icon={<AtIcon size={13} weight="light" />} />
                <InfoField label="Phone" value={lead.phone || "Not provided"} icon={<PhoneIcon size={13} weight="light" />} />
                <InfoField label="Submitted" value={new Date(lead.createdAt).toLocaleString()} icon={<CalendarBlankIcon size={13} weight="light" />} />
              </div>

              {lead.serviceInterest && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-1">Interested In</p>
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-10 text-[13px] font-medium text-blue">{lead.serviceInterest}</span>
                </div>
              )}

              {lead.message && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-1.5">Message</p>
                  <div className="bg-ice-30/50 rounded-xl p-4 text-[13px] text-text-primary leading-relaxed whitespace-pre-line">
                    {lead.message}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-ice flex-shrink-0 flex gap-2">
              {lead.status === "new" && (
                <button onClick={() => handleStatus("reviewed")} disabled={updating}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-warning bg-warning/10 rounded-xl hover:bg-warning/20 transition-colors disabled:opacity-50">
                  <ClockIcon size={15} weight="light" /> Mark Reviewed
                </button>
              )}
              {(lead.status === "new" || lead.status === "reviewed") && (
                <button onClick={() => handleStatus("responded")} disabled={updating}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-xl transition-colors disabled:opacity-50">
                  <CheckCircleIcon size={15} weight="light" /> Mark Responded
                </button>
              )}
              {lead.status === "responded" && (
                <div className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-success">
                  <CheckCircleIcon size={15} weight="fill" /> Responded
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted mb-0.5">{label}</p>
      <p className="text-[13px] text-text-primary flex items-center gap-1.5">
        <span className="text-text-muted shrink-0">{icon}</span>
        {value}
      </p>
    </div>
  );
}
