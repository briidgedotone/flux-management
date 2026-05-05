"use client";

import { useState } from "react";
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";

type SettingsTab = "general" | "notifications" | "security";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "Profile", icon: <UserIcon size={18} weight="light" /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon size={18} weight="light" /> },
  { id: "security", label: "Security", icon: <ShieldCheckIcon size={18} weight="light" /> },
];

function ProfileTab({ user }: { user: { name: string; email: string; role: string } | null }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const roleLabel = (user?.role ?? "").replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-navy-80 flex items-center justify-center text-white font-[family-name:var(--font-aptos)] font-semibold text-xl">
          {initials}
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary">{user?.name ?? "Loading..."}</h3>
          <p className="text-sm text-text-secondary capitalize">{roleLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField label="Full Name" value={user?.name ?? "—"} />
        <InfoField label="Email" value={user?.email ?? "—"} />
        <InfoField label="Role" value={roleLabel || "—"} />
        <InfoField label="Company" value="Flux Technologies" />
      </div>

      <div className="bg-ice-30/50 rounded-xl p-4">
        <p className="text-xs text-text-muted">
          Profile information is managed through Microsoft Azure AD. To update your name, email, or role, contact your Azure AD administrator.
        </p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const notifications = [
    { label: "Critical Ticket Alerts", description: "Email when a new critical ticket is created during Atera sync", enabled: true },
    { label: "Contact Form Submissions", description: "Email and in-app notification when someone submits the website contact form", enabled: true },
    { label: "Weekly Digest", description: "Weekly email summary of ticket activity, project progress, and key metrics", enabled: true },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">Notifications are sent automatically based on system events. These are the active notification types:</p>
      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.label} className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-text-primary">{n.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{n.description}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Active
            </span>
          </div>
        ))}
      </div>
      <div className="bg-ice-30/50 rounded-xl p-4">
        <p className="text-xs text-text-muted">
          Notification preferences are managed at the system level. All co-CEO and director users receive these notifications. Contact an administrator to modify notification settings.
        </p>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Authentication</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-text-primary">Microsoft SSO</p>
              <p className="text-xs text-text-muted mt-0.5">Sign in with your Microsoft account via Azure Active Directory</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Active
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-text-primary">Multi-Factor Authentication (MFA)</p>
              <p className="text-xs text-text-muted mt-0.5">Additional security layer managed through Azure AD Conditional Access</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
              Managed by Azure AD
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-ice pt-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Access Control</h3>
        <div className="space-y-3">
          {[
            { role: "Co-CEO", access: "Full access to all features, reports, settings, and AI assistant" },
            { role: "Director", access: "Full access to all features, reports, and AI assistant" },
            { role: "Employee", access: "Projects and assigned tasks only. Cannot view reports, manage clients, or use AI." },
          ].map((r) => (
            <div key={r.role} className="p-4 bg-white border border-ice/50 rounded-2xl">
              <p className="text-sm font-medium text-text-primary">{r.role}</p>
              <p className="text-xs text-text-muted mt-0.5">{r.access}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-ice pt-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Data Protection</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Encryption in Transit", value: "HTTPS/TLS" },
            { label: "Encryption at Rest", value: "Azure PostgreSQL" },
            { label: "Session Management", value: "JWT (24h expiry)" },
            { label: "Audit Logging", value: "All mutations logged" },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-ice-30/50 rounded-xl">
              <p className="text-[10px] uppercase tracking-[0.08em] font-medium text-text-muted">{item.label}</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">{label}</p>
      <p className="h-10 flex items-center px-3 bg-ice-30/50 border border-ice/50 rounded-xl text-sm text-text-primary">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawAuth } = useAuth();
  const user = rawAuth as { name: string; email: string; role: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Account and portal configuration" />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-48 flex-shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 w-full text-left ${
                  activeTab === tab.id ? "bg-blue-10 text-blue" : "text-text-secondary hover:bg-ice-30"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1 bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
          {activeTab === "general" && <ProfileTab user={user} />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
