"use client";

import { useState } from "react";
import {
  TicketIcon, MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useTickets } from "@/hooks/use-tickets";
import { useClientFilter } from "@/hooks/use-client-filter";
import type { Ticket, TicketStatus, TicketPriority } from "@/data/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { TicketSlideOver } from "@/components/shared/ticket-slide-over";
import { cn } from "@/lib/utils";

const PER_PAGE = 15;

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const { clientId, clientName, isFiltered } = useClientFilter();

  const { data: ticketsResp, isLoading } = useTickets({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    clientId: clientId ?? undefined,
    page,
    limit: PER_PAGE,
    sort: "created_at",
    order: "desc",
  });

  const resp = ticketsResp as any;
  const tickets: any[] = resp?.data ?? [];
  const total = resp?.total ?? 0;
  const totalPages = resp?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <MagnifyingGlassIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets..." className="w-full h-10 pl-9 pr-4 text-sm border border-ice rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 text-sm border border-ice rounded-xl px-3 bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition">
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="Pending">Pending</option>
          <option value="Closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="h-10 text-sm border border-ice rounded-xl px-3 bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition">
          <option value="">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-text-muted">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <TicketIcon size={40} weight="light" className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">No tickets found.</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-ice/60">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted pl-6 pr-4 py-3.5">Ticket</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Subject</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Client</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Priority</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Assigned</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: any) => (
                  <tr key={t.id} onClick={() => setSelected(t)}
                    className="border-t border-ice/40 last:border-0 cursor-pointer hover:bg-blue-10/30 transition-colors duration-150">
                    <td className="pl-6 pr-4 py-3.5">
                      <span className="font-mono text-[13px] text-blue">{t.ticketNumber ? `#${t.ticketNumber.split("_").pop()}` : t.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-primary max-w-[280px] truncate">{t.subject}</td>
                    <td className="px-4 py-3.5 text-[13px] text-text-secondary">{t.clientName}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3.5"><PriorityIndicator priority={t.priority} /></td>
                    <td className="px-4 py-3.5">
                      {t.assignedToName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                            <span className="text-[8px] text-white font-semibold">
                              {String(t.assignedToName).split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-[12px] text-text-secondary">{t.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-[12px] text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-text-muted whitespace-nowrap">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-ice/60">
              <span className="text-[12px] text-text-muted">{total} ticket{total !== 1 ? "s" : ""}</span>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium text-text-secondary border border-ice hover:bg-ice-30 disabled:opacity-30 transition-colors">
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={cn("w-8 h-8 rounded-lg text-[12px] font-medium transition-colors",
                        p === page ? "bg-blue text-white" : "text-text-secondary hover:bg-ice-30"
                      )}>{p}</button>
                  );
                })}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium text-text-secondary border border-ice hover:bg-ice-30 disabled:opacity-30 transition-colors">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TicketSlideOver ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
