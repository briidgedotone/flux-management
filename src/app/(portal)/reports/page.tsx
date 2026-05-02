"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  CurrencyDollarIcon,
  UsersThreeIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  ChartLineUpIcon,
  TrendUpIcon,
  ChartBarIcon,
  TargetIcon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";

const reportTypes = [
  {
    title: "Revenue Report",
    description: "Monthly revenue breakdown by client",
    icon: CurrencyDollarIcon,
    iconBg: "bg-success-tint",
    iconColor: "text-success",
    href: "/reports/revenue",
    stat: "—",
    statLabel: "This month",
    accentColor: "#0D7C5F",
    secondaryIcon: TrendUpIcon,
  },
  {
    title: "Team Performance",
    description: "Team utilization and productivity metrics",
    icon: UsersThreeIcon,
    iconBg: "bg-blue-10",
    iconColor: "text-blue",
    href: "/reports/team-performance",
    stat: "—",
    statLabel: "Avg utilization",
    accentColor: "#15549D",
    secondaryIcon: ChartBarIcon,
  },
  {
    title: "SLA Compliance",
    description: "SLA adherence across all clients",
    icon: ShieldCheckIcon,
    iconBg: "bg-blue-10",
    iconColor: "text-blue",
    href: "/reports/sla-compliance",
    stat: "—",
    statLabel: "Resolution rate",
    accentColor: "#1A6BC4",
    secondaryIcon: TargetIcon,
  },
  {
    title: "Ticket Analytics",
    description: "Resolution times and ticket trends",
    icon: ClockIcon,
    iconBg: "bg-error-tint",
    iconColor: "text-error",
    href: "/reports/ticket-analytics",
    stat: "—",
    statLabel: "Avg resolution",
    accentColor: "#C53030",
    secondaryIcon: ChartLineUpIcon,
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function ReportsPage() {
  const router = useRouter();
  const { data: d } = useDashboard();

  // Override hardcoded stats with real data from dashboard API
  const dynamicStats: Record<string, string> = {};
  if (d) {
    dynamicStats["/reports/ticket-analytics"] = `${d.tickets.avgResolutionHours.toFixed(1)}h`;
    dynamicStats["/reports/sla-compliance"] = d.tickets.createdLast30d > 0
      ? `${Math.round((d.tickets.resolvedLast30d / d.tickets.createdLast30d) * 100)}%`
      : "—";
    dynamicStats["/reports/team-performance"] = `${d.team.totalMembers} members`;
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Analytics and insights" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
      >
        {reportTypes.map((report) => (
          <motion.button
            key={report.href}
            variants={cardVariants}
            type="button"
            onClick={() => router.push(report.href)}
            className="group relative bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 text-left card-hover-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 transition-all duration-200 overflow-hidden"
          >
            {/* Subtle accent gradient in top-right corner */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300 rounded-bl-full"
              style={{
                background: `radial-gradient(circle at top right, ${report.accentColor}, transparent 70%)`,
              }}
              aria-hidden="true"
            />

            <div className="relative flex items-start justify-between">
              <div
                className={`w-11 h-11 rounded-xl ${report.iconBg} flex items-center justify-center`}
              >
                <report.icon
                  size={22}
                  className={report.iconColor}
                  weight="duotone"
                />
              </div>
              <report.secondaryIcon
                size={18}
                className="text-ice opacity-60 group-hover:opacity-100 group-hover:text-text-muted transition-all duration-200"
                weight="light"
                aria-hidden="true"
              />
            </div>

            <div className="relative mt-4">
              <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">
                {report.title}
              </h2>
              <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="relative flex items-center justify-between mt-5 pt-4 border-t border-ice/50">
              <div>
                <span className="font-[family-name:var(--font-aptos)] font-bold text-lg text-navy">
                  {dynamicStats[report.href] ?? report.stat}
                </span>
                <span className="text-[11px] text-text-muted ml-1.5">
                  {report.statLabel}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-blue group-hover:gap-2 transition-all duration-200">
                View
                <ArrowRightIcon
                  size={13}
                  weight="bold"
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
