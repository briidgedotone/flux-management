"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingsIcon, MagnifyingGlassIcon, FunnelIcon, WarningCircleIcon, CaretRightIcon,
} from "@phosphor-icons/react";
import { useClients } from "@/hooks/use-clients";
import { useClientFilter } from "@/hooks/use-client-filter";

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const { clientName, isFiltered } = useClientFilter();

  const { data: clientsResponse, isLoading } = useClients({
    search: search || undefined,
    industry: industryFilter || undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clients: any[] = (clientsResponse as any)?.data ?? [];

  return (
    <div className="space-y-5">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="w-full h-10 pl-9 pr-4 text-sm border border-ice rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition" />
        </div>
        <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="h-10 text-sm border border-ice rounded-xl px-3 bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition">
          <option value="">All Industries</option>
          {["Financial Services", "Professional Services", "Technology", "Healthcare", "Legal"].map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-text-muted">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-sm text-text-muted">No clients found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ice/60">
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted pl-6 pr-4 py-3.5">Company</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Contact</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5">Industry</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5 whitespace-nowrap">Tickets</th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted px-4 py-3.5 whitespace-nowrap">Projects</th>
                <th className="w-10 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="border-b border-ice/40 last:border-0 cursor-pointer hover:bg-blue-10/50 transition-colors duration-150 group"
                >
                  <td className="pl-6 pr-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-navy">
                          {c.companyName?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[13px] font-semibold text-text-primary">{c.companyName}</span>
                        {!c.hasProfile && (
                          <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium text-warning bg-warning/10">
                            <WarningCircleIcon size={9} weight="fill" />
                            No profile
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {c.primaryContact?.name ? (
                      <div>
                        <p className="text-[13px] text-text-primary">{c.primaryContact.name}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{c.primaryContact.email}</p>
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-muted italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {c.industry ? (
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-ice-30/80 text-[12px] font-medium text-text-secondary">{c.industry}</span>
                    ) : (
                      <span className="text-[12px] text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-[14px] font-semibold text-text-primary tabular-nums">{c.openTickets}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-[14px] font-semibold text-text-primary tabular-nums">{c.activeProjects}</span>
                  </td>
                  <td className="pr-4 py-4">
                    <CaretRightIcon size={14} weight="light" className="text-text-muted/40 group-hover:text-blue transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
