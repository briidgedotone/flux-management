"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  EnvelopeOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatCircleDotsIcon,
  BuildingsIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@phosphor-icons/react";
import { useContactSubmissions, useUpdateSubmission } from "@/hooks/use-contact-submissions";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof ClockIcon }> = {
  new: { label: "New", color: "text-blue", bg: "bg-blue-10", icon: EnvelopeOpenIcon },
  reviewed: { label: "Reviewed", color: "text-warning", bg: "bg-warning/10", icon: ClockIcon },
  responded: { label: "Responded", color: "text-success", bg: "bg-success-tint", icon: CheckCircleIcon },
};

export default function ContactSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: rawData, isLoading } = useContactSubmissions({
    status: statusFilter || undefined,
    limit: 50,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = rawData as any;
  const submissions: any[] = resp?.data ?? [];
  const total = resp?.total ?? 0;

  const [selected, setSelected] = useState<any>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Submissions"
        subtitle="Leads from the Flux Technologies website"
      />

      {/* Stats strip */}
      <div className="flex items-center gap-6 text-sm">
        <button onClick={() => setStatusFilter("")} className={cn("flex items-center gap-1.5", !statusFilter ? "text-blue font-medium" : "text-text-secondary hover:text-text-primary")}>
          All ({total})
        </button>
        {["new", "reviewed", "responded"].map((s) => {
          const cfg = statusConfig[s];
          const count = submissions.filter((sub: any) => sub.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("flex items-center gap-1.5", statusFilter === s ? `${cfg.color} font-medium` : "text-text-secondary hover:text-text-primary")}>
              <cfg.icon size={14} weight="light" />
              {cfg.label} ({statusFilter ? count : "..."})
            </button>
          );
        })}
      </div>

      {isLoading && <div className="text-center py-12 text-sm text-text-muted">Loading submissions...</div>}

      {/* Submissions list */}
      <div className="space-y-3">
        {submissions.map((sub: any) => {
          const cfg = statusConfig[sub.status] ?? statusConfig.new;
          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-white rounded-2xl shadow-level-1 border p-5 cursor-pointer hover:shadow-level-2 transition-all",
                sub.status === "new" ? "border-blue/20" : "border-ice/40"
              )}
              onClick={() => setSelected(selected?.id === sub.id ? null : sub)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">
                      {sub.name}
                    </h3>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.color, cfg.bg)}>
                      <cfg.icon size={10} weight="fill" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    {sub.company && (
                      <span className="flex items-center gap-1"><BuildingsIcon size={12} weight="light" />{sub.company}</span>
                    )}
                    <span className="flex items-center gap-1"><EnvelopeIcon size={12} weight="light" />{sub.email}</span>
                    {sub.phone && (
                      <span className="flex items-center gap-1"><PhoneIcon size={12} weight="light" />{sub.phone}</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(sub.createdAt).toLocaleString()}
                    {sub.serviceInterest && ` · Interested in: ${sub.serviceInterest}`}
                  </p>
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === sub.id && (
                <div className="mt-4 pt-4 border-t border-ice">
                  {sub.message && (
                    <div className="mb-4">
                      <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted mb-1">Message</p>
                      <p className="text-sm text-text-primary whitespace-pre-line">{sub.message}</p>
                    </div>
                  )}
                  <SubmissionActions submission={sub} />
                </div>
              )}
            </motion.div>
          );
        })}
        {!isLoading && submissions.length === 0 && (
          <div className="text-center py-12">
            <ChatCircleDotsIcon size={40} weight="light" className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No contact submissions {statusFilter ? `with status "${statusFilter}"` : "yet"}.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionActions({ submission }: { submission: any }) {
  const updateSubmission = useUpdateSubmission();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await updateSubmission.mutateAsync({ id: submission.id, status: newStatus });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {submission.status === "new" && (
        <button onClick={() => handleStatusChange("reviewed")} disabled={updating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warning bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors disabled:opacity-50">
          <ClockIcon size={12} weight="light" /> Mark as Reviewed
        </button>
      )}
      {(submission.status === "new" || submission.status === "reviewed") && (
        <button onClick={() => handleStatusChange("responded")} disabled={updating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success-tint rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50">
          <CheckCircleIcon size={12} weight="light" /> Mark as Responded
        </button>
      )}
      {submission.status === "responded" && (
        <span className="text-xs text-success font-medium flex items-center gap-1">
          <CheckCircleIcon size={12} weight="fill" /> Responded
        </span>
      )}
    </div>
  );
}
