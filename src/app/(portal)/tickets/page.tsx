"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TicketIcon, MagnifyingGlassIcon, FunnelIcon } from "@phosphor-icons/react";
import { useTickets } from "@/hooks/use-tickets";
import type { Ticket, TicketStatus, TicketPriority } from "@/data/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { PageHeader } from "@/components/shared/page-header";

const PER_PAGE = 10;

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TicketPriority>("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const { data: ticketsResp, isLoading } = useTickets({
    search: search || undefined,
    status: statusFilter !== "All" ? statusFilter : undefined,
    priority: priorityFilter !== "All" ? priorityFilter : undefined,
    page,
    limit: PER_PAGE,
    sort: "created_at",
    order: "desc",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = ticketsResp as any;
  const paged: any[] = resp?.data ?? [];
  const totalPages = resp?.totalPages ?? 1;

  const selectCls =
    "h-9 rounded-lg border border-ice bg-white px-3 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-blue";

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" subtitle="All client tickets" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ticket # or subject..."
            className="w-full h-9 rounded-lg border border-ice bg-white pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </div>
        <FunnelIcon size={16} weight="light" className="text-text-muted" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }} className={selectCls}>
          <option value="All">All Status</option>
          <option>Open</option><option>Pending</option><option>Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value as typeof priorityFilter); setPage(1); }} className={selectCls}>
          <option value="All">All Priority</option>
          <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
        </select>
        {/* Client filter removed — server-side filtering via API */}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-ice-30 h-11">
                {["Ticket #", "Subject", "Client", "Status", "Priority", "Assigned To", "Updated"].map((h) => (
                  <th key={h} className="px-5 text-left text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => (
                <motion.tr
                  key={t.id}
                  whileHover={{ backgroundColor: "rgba(56,120,244,0.04)" }}
                  onClick={() => setSelected(t)}
                  className="h-[52px] border-b border-silver-light cursor-pointer transition-colors"
                >
                  <td className="px-5 font-mono text-sm text-blue">#{t.id}</td>
                  <td className="px-5 text-[13px] text-text-primary max-w-[260px] truncate">{t.subject}</td>
                  <td className="px-5 text-xs text-text-secondary">{t.clientName}</td>
                  <td className="px-5"><StatusBadge status={t.status} /></td>
                  <td className="px-5"><PriorityIndicator priority={t.priority} /></td>
                  <td className="px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">{t.assignedTo.initials}</span>
                      </div>
                      <span className="text-xs text-text-secondary">{t.assignedTo.name}</span>
                    </div>
                  </td>
                  <td className="px-5 text-xs text-text-muted">{t.updated}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-ice">
          <span className="text-xs text-text-muted">{resp?.total ?? 0} ticket{(resp?.total ?? 0) !== 1 && "s"}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 px-3 rounded-lg text-xs text-text-secondary border border-ice disabled:opacity-40 hover:bg-ice-30 transition-colors">Prev</button>
            <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-8 px-3 rounded-lg text-xs text-text-secondary border border-ice disabled:opacity-40 hover:bg-ice-30 transition-colors">Next</button>
          </div>
        </div>
      </div>

      <TicketSlideOver ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
