"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./sidebar/sidebar";
import { TopBar } from "./top-bar/top-bar";
import { MobileBottomBar } from "./mobile-bottom-bar/mobile-bottom-bar";
import { CommandPalette } from "../overlays/command-palette/command-palette";
import { NotificationDropdown } from "../overlays/notification-dropdown/notification-dropdown";
import { UserDropdown } from "../overlays/user-dropdown/user-dropdown";
import { ToastContainer } from "../overlays/toast-notification/toast-container";
import { useSidebarStore } from "@/stores/sidebar-store";

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { isExpanded } = useSidebarStore();

  // Global ⌘K handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNotifClick = useCallback(() => {
    setNotifOpen((p) => !p);
    setUserOpen(false);
  }, []);

  const handleUserClick = useCallback(() => {
    setUserOpen((p) => !p);
    setNotifOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <Sidebar />

      <div
        className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? "lg:ml-[260px]" : "lg:ml-[72px]"
        }`}
      >
        <div className="sticky top-0 z-30 relative">
          <TopBar
            onSearchClick={() => setSearchOpen(true)}
            onNotificationClick={handleNotifClick}
            onUserClick={handleUserClick}
          />

          {/* Dropdown anchors */}
          <div className="absolute top-0 right-4 md:right-6 lg:right-8">
            <div className="relative">
              <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
          <div className="absolute top-0 right-4 md:right-6 lg:right-8">
            <div className="relative">
              <UserDropdown open={userOpen} onClose={() => setUserOpen(false)} />
            </div>
          </div>
        </div>

        <main className="px-4 md:px-6 lg:px-10 py-8 max-w-[1200px] mx-auto pb-24 md:pb-8 animate-page-in">
          {children}
        </main>
      </div>

      <MobileBottomBar />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ToastContainer />
    </div>
  );
}
