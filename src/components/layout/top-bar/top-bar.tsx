"use client";

import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationStore } from "@/stores/notification-store";
import {
  MagnifyingGlassIcon,
  BellIcon,
  ListIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/tickets": "Tickets",
  "/projects": "Projects",
  "/team": "Team",
  "/reports": "Reports",
  "/ai-assistant": "AI Assistant",
  "/settings": "Settings",
};

interface TopBarProps {
  onSearchClick: () => void;
  onNotificationClick: () => void;
  onUserClick: () => void;
}

export function TopBar({ onSearchClick, onNotificationClick, onUserClick }: TopBarProps) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebarStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { data: auth } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userInitials = ((auth as any)?.name ?? "").split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?";

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = routeLabels[path] || seg.replace(/[-[\]]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, path, isLast: i === segments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-30 flex items-center h-[60px] bg-white/80 backdrop-blur-xl border-b border-ice/60 px-4 md:px-6 lg:px-10">
      {/* Left: Hamburger (mobile/tablet) + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ice-30 transition-colors duration-150"
        >
          <ListIcon size={22} weight="light" className="text-text-primary" />
        </button>

        <nav className="hidden sm:flex items-center gap-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <CaretRightIcon size={14} weight="light" className="text-text-muted" />}
              <span
                className={`text-[13px] truncate ${
                  crumb.isLast
                    ? "text-text-primary font-medium"
                    : "text-text-muted hover:text-blue cursor-pointer"
                }`}
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Search Pill (desktop) */}
      <div className="hidden md:flex flex-1 justify-center">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 h-9 px-4 rounded-full bg-white/60 border border-ice/80 hover:border-blue/30 hover:bg-white/80 shadow-level-1 transition-all duration-300"
          style={{ width: 420, maxWidth: "100%" }}
        >
          <MagnifyingGlassIcon size={16} weight="light" className="text-text-muted" />
          <span className="text-[13px] text-text-muted flex-1 text-left">Search anything...</span>
          <kbd className="text-[11px] text-text-muted bg-white px-1.5 py-0.5 rounded border border-ice">⌘K</kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Mobile search icon */}
        <button
          onClick={onSearchClick}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-ice-30 transition-colors duration-150"
        >
          <MagnifyingGlassIcon size={20} weight="light" className="text-text-secondary" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onNotificationClick}
          className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-ice-30 transition-colors duration-150"
        >
          <BellIcon size={20} weight="light" className="text-text-secondary" />
          {unreadCount() > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
          )}
        </button>

        {/* User Avatar */}
        <button
          onClick={onUserClick}
          className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-navy-80 text-white text-xs font-medium hover:ring-2 hover:ring-blue-10 transition-all duration-150"
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
}
