"use client";

import {
  TicketIcon, KanbanIcon, GearSixIcon, BellIcon,
  UsersThreeIcon, WarningIcon, BuildingsIcon, EnvelopeOpenIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { useNotifications, useUnreadCount, useMarkRead } from "@/hooks/use-notifications";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  ticket: { icon: <TicketIcon size={16} weight="light" />, bg: "bg-blue-10", color: "text-blue" },
  ticket_escalation: { icon: <WarningIcon size={16} weight="light" />, bg: "bg-error/10", color: "text-error" },
  project: { icon: <KanbanIcon size={16} weight="light" />, bg: "bg-success-tint", color: "text-success" },
  system: { icon: <GearSixIcon size={16} weight="light" />, bg: "bg-ice-30", color: "text-text-secondary" },
  task_assignment: { icon: <KanbanIcon size={16} weight="light" />, bg: "bg-blue-10", color: "text-blue" },
  contact_form: { icon: <EnvelopeOpenIcon size={16} weight="light" />, bg: "bg-blue-10", color: "text-blue" },
  health_alert: { icon: <WarningIcon size={16} weight="light" />, bg: "bg-warning/10", color: "text-warning" },
  team_update: { icon: <UsersThreeIcon size={16} weight="light" />, bg: "bg-success-tint", color: "text-success" },
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const { data: rawNotifs } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const markRead = useMarkRead();
  const ref = useRef<HTMLDivElement>(null);

  const notifications: any[] = (rawNotifs as any)?.data ?? [];
  const unreadCount = (unreadData as any)?.count ?? 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-0 mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl shadow-level-3 border border-ice/40 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-ice">
            <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-[11px] font-medium text-white bg-blue rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={() => markRead.mutate(undefined)} className="text-[12px] text-blue hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <BellIcon size={40} weight="light" className="text-text-muted mb-2" />
                <p className="text-[13px] text-text-muted">No notifications yet</p>
                <p className="text-[11px] text-text-muted mt-0.5">You'll see alerts for critical tickets, contact forms, and more</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const icon = typeIcons[n.type] ?? typeIcons.system;
                return (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
                    className="relative flex items-start gap-3 w-full px-5 py-3 border-b border-ice/40 last:border-0 hover:bg-ice-30/50 transition-colors text-left"
                  >
                    {!n.isRead && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue" />
                    )}
                    <div className={`w-8 h-8 rounded-full ${icon.bg} ${icon.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {icon.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug ${n.isRead ? "text-text-secondary" : "text-text-primary font-medium"}`}>
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{n.description}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted whitespace-nowrap flex-shrink-0 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
