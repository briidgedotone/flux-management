"use client";

import { type ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KpiTrend {
  value: string;
  direction: "up" | "down";
  sentiment: "positive" | "negative";
}

interface KpiCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  trend?: KpiTrend;
  iconBgClass: string;
  iconColorClass: string;
  onClick?: () => void;
  index?: number;
}

export function KpiCard({
  icon,
  value,
  label,
  trend,
  iconBgClass,
  iconColorClass,
  onClick,
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 bg-white rounded-2xl shadow-level-1 p-6 h-[116px] border border-white/80",
        "card-hover-glow",
        onClick && "cursor-pointer"
      )}
    >
      {/* Icon Circle */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
          iconBgClass
        )}
      >
        <div className={cn("flex items-center justify-center", iconColorClass)}>
          {icon}
        </div>
      </div>

      {/* Value + Label */}
      <div className="flex flex-col min-w-0">
        <span className="font-[family-name:var(--font-aptos)] font-bold text-[28px] leading-tight tracking-[-0.02em] text-text-primary">
          {value}
        </span>
        <span className="font-medium text-[11px] uppercase tracking-[0.08em] text-text-muted">
          {label}
        </span>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {trend.direction === "up" ? (
            <ArrowUpIcon
              size={12}
              weight="light"
              className={
                trend.sentiment === "positive"
                  ? "text-success"
                  : "text-error"
              }
            />
          ) : (
            <ArrowDownIcon
              size={12}
              weight="light"
              className={
                trend.sentiment === "positive"
                  ? "text-success"
                  : "text-error"
              }
            />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend.sentiment === "positive"
                ? "text-success"
                : "text-error"
            )}
          >
            {trend.value}
          </span>
        </div>
      )}
    </motion.div>
  );
}
