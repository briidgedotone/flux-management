"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BuildingsIcon, MagnifyingGlassIcon, FunnelIcon, PlusIcon, CaretRightIcon,
} from "@phosphor-icons/react";
import { StatusBadge } from "@/components/shared/status-badge";
import { useClients } from "@/hooks/use-clients";
import type { Client, HealthScore, ContractStatus } from "@/data/types";

const healthDot: Record<HealthScore, string> = {
  healthy: "bg-success", "at-risk": "bg-warning", critical: "bg-error",
};
const healthLabel: Record<HealthScore, string> = {
  healthy: "Healthy", "at-risk": "At Risk", critical: "Critical",
};
const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState<HealthScore | "">("");
  const [contractFilter, setContractFilter] = useState<ContractStatus | "">("");

  const { data: clientsResponse, isLoading } = useClients({
    search: search || undefined,
    industry: industryFilter || undefined,
    healthScore: healthFilter || undefined,
    contractStatus: contractFilter || undefined,
  });
  const filtered = (clientsResponse as { data?: Client[] })?.data ?? [];

  const columns = ["Company Name", "Primary Contact", "Industry", "Health Score", "Contract", "Monthly Revenue", "Open Tickets", "SLA", ""];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-10">
            <BuildingsIcon size={22} weight="light" className="text-blue" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-9 tracking-[-0.02em] text-text-primary">Clients</h1>
            <p className="text-sm text-text-secondary mt-0.5">Manage your client accounts</p>
          </div>
        </div>
{/* Add Client — not yet implemented */}
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
          <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value as HealthScore | "")} className="text-xs border border-ice rounded-lg px-3 py-2 bg-white text-text-secondary focus:outline-none">
            <option value="">All Health</option>
            <option value="healthy">Healthy</option>
            <option value="at-risk">At Risk</option>
            <option value="critical">Critical</option>
          </select>
          <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value as ContractStatus | "")} className="text-xs border border-ice rounded-lg px-3 py-2 bg-white text-text-secondary focus:outline-none">
            <option value="">All Contracts</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ice">
              {columns.map((h) => <th key={h} className="pb-3 pr-4 text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <motion.tr key={c.id} whileHover={{ backgroundColor: "rgba(232,240,250,0.4)" }} onClick={() => router.push(`/clients/${c.id}`)} className="border-b border-ice last:border-0 cursor-pointer">
                <td className="py-3.5 pr-4 text-sm font-medium text-text-primary">{c.companyName}</td>
                <td className="py-3.5 pr-4"><span className="text-sm text-text-primary">{c.primaryContact.name}</span><br /><span className="text-xs text-text-muted">{c.primaryContact.email}</span></td>
                <td className="py-3.5 pr-4 text-xs text-text-secondary">{c.industry}</td>
                <td className="py-3.5 pr-4"><span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${healthDot[c.healthScore]}`} /><span className="text-xs text-text-secondary">{healthLabel[c.healthScore]}</span></span></td>
                <td className="py-3.5 pr-4"><StatusBadge status={c.contractStatus} /></td>
                <td className="py-3.5 pr-4 text-sm text-text-primary font-medium tabular-nums">{fmt(c.monthlyRevenue)}</td>
                <td className="py-3.5 pr-4 text-sm text-text-secondary tabular-nums">{c.openTickets}</td>
                <td className="py-3.5 pr-4 text-xs text-text-secondary tabular-nums">{c.slaCompliance}%</td>
                <td className="py-3.5"><CaretRightIcon size={16} weight="light" className="text-text-muted" /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-sm text-text-muted py-8">No clients match your filters.</p>}
      </div>
    </div>
  );
}
