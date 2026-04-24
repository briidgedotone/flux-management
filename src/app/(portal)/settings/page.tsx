"use client";

import { useState } from "react";
import {
  UserIcon,
  BellIcon,
  LockIcon,
  PaletteIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  UsersThreeIcon,
  PlugsIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";

type SettingsTab = "general" | "team" | "integrations" | "notifications" | "security";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <UserIcon size={18} weight="light" /> },
  { id: "team", label: "Team Management", icon: <UsersThreeIcon size={18} weight="light" /> },
  { id: "integrations", label: "Integrations", icon: <PlugsIcon size={18} weight="light" /> },
  { id: "notifications", label: "Notifications", icon: <BellIcon size={18} weight="light" /> },
  { id: "security", label: "Security", icon: <LockIcon size={18} weight="light" /> },
];

function GeneralTab({ user }: { user: { name: string; email: string; role: string } | null }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-navy-80 flex items-center justify-center text-white font-[family-name:var(--font-aptos)] font-semibold text-xl">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue text-white flex items-center justify-center shadow-level-1">
            <CameraIcon size={14} weight="light" />
          </button>
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-text-primary">{user?.name ?? "Loading..."}</h3>
          <p className="text-sm text-text-secondary">{user?.role ?? ""}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Full Name", value: user?.name ?? "" },
          { label: "Email", value: user?.email ?? "" },
          { label: "Role", value: user?.role ?? "" },
          { label: "Company", value: "Flux Technologies" },
          { label: "Phone", value: "+1 (555) 100-2000" },
          { label: "Timezone", value: "Eastern Time (ET)" },
        ].map((field) => (
          <div key={field.label}>
            <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">{field.label}</label>
            <input defaultValue={field.value} className="w-full h-10 bg-white border border-ice rounded-xl px-3 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button className="h-10 px-5 bg-blue hover:bg-blue-light text-white text-sm font-medium rounded-lg transition-colors duration-150">Save Changes</button>
      </div>
    </div>
  );
}

function TeamManagementTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Role Permissions</h3>
        <p className="text-sm text-text-secondary mb-4">Configure what each role can access in the management portal.</p>
        <div className="space-y-3">
          {[
            { role: "Co-CEO", permissions: "Full access to all features, reports, and settings", editable: false },
            { role: "Director", permissions: "Access to clients, tickets, projects, team, and reports", editable: true },
            { role: "Employee", permissions: "Access to assigned tickets and projects only", editable: true },
          ].map((r) => (
            <div key={r.role} className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
              <div>
                <p className="text-sm font-medium text-text-primary">{r.role}</p>
                <p className="text-xs text-text-muted mt-0.5">{r.permissions}</p>
              </div>
              {r.editable && <button className="text-xs text-blue hover:underline">Edit</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    { name: "Atera RMM", status: "connected" as const, lastSynced: "2 min ago", description: "Ticket and device sync" },
    { name: "Microsoft 365", status: "connected" as const, lastSynced: "5 min ago", description: "Email and calendar integration" },
    { name: "SharePoint", status: "connected" as const, lastSynced: "10 min ago", description: "Document management sync" },
    { name: "Slack", status: "disconnected" as const, lastSynced: "Never", description: "Team notifications" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">Connect external services to sync data with the management portal.</p>
      <div className="space-y-3">
        {integrations.map((int) => (
          <div key={int.name} className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-text-primary">{int.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{int.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${int.status === "connected" ? "bg-success" : "bg-error"}`} />
                <span className={`text-xs font-medium ${int.status === "connected" ? "text-success" : "text-error"}`}>
                  {int.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <button className={`text-xs ${int.status === "connected" ? "text-text-muted hover:text-error" : "text-blue hover:underline"}`}>
                {int.status === "connected" ? "Disconnect" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const categories = [
    { label: "Ticket Escalations", description: "When tickets are escalated to Critical priority", email: true, push: true },
    { label: "Client Health Alerts", description: "When client health score changes to at-risk or critical", email: true, push: true },
    { label: "Project Milestones", description: "When project milestones are reached or deadlines approach", email: true, push: false },
    { label: "Team Updates", description: "When team members join, leave, or change roles", email: false, push: true },
    { label: "SLA Warnings", description: "When SLA compliance drops below threshold", email: true, push: true },
    { label: "Weekly Summary", description: "Digest of weekly activity and revenue metrics", email: true, push: false },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">Choose how you want to be notified about management activity.</p>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between p-4 bg-white border border-ice/50 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-text-primary">{cat.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{cat.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={cat.email} className="w-4 h-4 rounded border-ice text-blue focus:ring-blue" />
                <span className="text-xs text-text-secondary">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={cat.push} className="w-4 h-4 rounded border-ice text-blue focus:ring-blue" />
                <span className="text-xs text-text-secondary">Push</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Change Password</h3>
        <div className="space-y-3 max-w-md">
          {["Current Password", "New Password", "Confirm New Password"].map((label) => (
            <div key={label}>
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-1.5">{label}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full h-10 bg-white border border-ice rounded-xl px-3 pr-10 text-sm text-text-primary focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors" />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPassword ? <EyeSlashIcon size={16} weight="light" /> : <EyeIcon size={16} weight="light" />}
                </button>
              </div>
            </div>
          ))}
          <button className="h-10 px-5 bg-blue hover:bg-blue-light text-white text-sm font-medium rounded-lg transition-colors duration-150">Update Password</button>
        </div>
      </div>
      <div className="border-t border-ice pt-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Two-Factor Authentication</h3>
        <p className="text-sm text-text-secondary mb-3">Add an extra layer of security to your account.</p>
        <button className="h-10 px-5 bg-ice-30 hover:bg-ice text-text-primary text-sm font-medium rounded-lg border border-ice transition-colors duration-150">Enable 2FA</button>
      </div>
      <div className="border-t border-ice pt-6">
        <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[17px] text-text-primary mb-3">Active Sessions</h3>
        <div className="space-y-2">
          {[
            { device: "MacBook Pro - Chrome", location: "New York, US", current: true },
            { device: "iPhone 15 - Safari", location: "New York, US", current: false },
          ].map((session) => (
            <div key={session.device} className="flex items-center justify-between p-3 bg-white border border-ice/50 rounded-2xl">
              <div>
                <p className="text-sm text-text-primary">{session.device}</p>
                <p className="text-xs text-text-muted">{session.location}</p>
              </div>
              {session.current ? (
                <span className="text-xs text-success font-medium">Current</span>
              ) : (
                <button className="text-xs text-error hover:underline">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { data: rawAuth } = useAuth();
  const user = (rawAuth as any)?.data as { name: string; email: string; role: string } | null ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your portal and account" />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 flex-shrink-0">
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
          {activeTab === "general" && <GeneralTab user={user} />}
          {activeTab === "team" && <TeamManagementTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}
