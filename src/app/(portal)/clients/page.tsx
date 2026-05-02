"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BuildingsIcon, MagnifyingGlassIcon, FunnelIcon, CaretRightIcon, WarningCircleIcon,
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
  const filtered: any[] = (clientsResponse as any)?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-10">
          <BuildingsIcon size={22} weight="light" className="text-blue" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-9 tracking-[-0.02em] text-text-primary">Clients</h1>
          <p className="text-sm text-text-secondary mt-0.5">{isFiltered ? `Showing ${clientName}` : "Manage your client accounts"}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="w-full pl-9 pr-4 py-2 text-sm border border-ice rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-blue transition" />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon size={16} weight="light" className="text-text-muted" />
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="text-xs border border-ice rounded-lg px-3 py-2 bg-white text-text-secondary focus:outline-none">
            <option value="">All Industries</option>
            {["Financial Services", "Professional Services", "Technology", "Healthcare", "Legal"].map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ice">
              {["Company Name", "Primary Contact", "Industry", "Open Tickets", "Active Projects", ""].map((h) => (
                <th key={h} className="pb-3 pr-4 text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <motion.tr key={c.id} whileHover={{ backgroundColor: "rgba(232,240,250,0.4)" }} onClick={() => router.push(`/clients/${c.id}`)} className="border-b border-ice last:border-0 cursor-pointer">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{c.companyName}</span>
                    {!c.hasProfile && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-warning bg-warning/10">
                        <WarningCircleIcon size={10} weight="fill" />
                        No profile
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 pr-4">
                  {c.primaryContact?.name ? (
                    <>
                      <span className="text-sm text-text-primary">{c.primaryContact.name}</span>
                      <br /><span className="text-xs text-text-muted">{c.primaryContact.email}</span>
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">Not set</span>
                  )}
                </td>
                <td className="py-3.5 pr-4 text-xs text-text-secondary">{c.industry || <span className="text-text-muted">—</span>}</td>
                <td className="py-3.5 pr-4 text-sm text-text-secondary tabular-nums">{c.openTickets}</td>
                <td className="py-3.5 pr-4 text-sm text-text-secondary tabular-nums">{c.activeProjects}</td>
                <td className="py-3.5"><CaretRightIcon size={16} weight="light" className="text-text-muted" /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-sm text-text-muted py-8">{isLoading ? "Loading..." : "No clients found."}</p>}
      </div>
    </div>
  );
}
