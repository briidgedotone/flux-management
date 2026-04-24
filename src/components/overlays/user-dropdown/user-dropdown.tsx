"use client";

import { useRouter } from "next/navigation";
import { GearSixIcon, SignOutIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface UserDropdownProps {
  open: boolean;
  onClose: () => void;
}

export function UserDropdown({ open, onClose }: UserDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: auth } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const handleSignOut = () => {
    window.location.href = "/api/auth/logout";
  };

  const initials = auth?.name
    ? auth.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-0 mt-2 w-[220px] bg-white rounded-2xl shadow-level-3 border border-ice/40 z-50 overflow-hidden"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-ice">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-80 flex items-center justify-center flex-shrink-0">
                <span className="font-[family-name:var(--font-aptos)] font-semibold text-sm text-white">
                  {initials}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{auth?.name ?? "User"}</p>
                <p className="text-xs text-text-muted truncate">{auth?.email ?? ""}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => { onClose(); router.push("/settings"); }}
              className="flex items-center gap-2.5 w-full px-4 h-10 text-left transition-colors hover:bg-ice-30 text-text-primary"
            >
              <span className="text-text-secondary"><GearSixIcon size={18} weight="light" /></span>
              <span className="text-[13px]">Account Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-4 h-10 text-left transition-colors hover:bg-ice-30 text-error"
            >
              <span className="text-error"><SignOutIcon size={18} weight="light" /></span>
              <span className="text-[13px]">Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
