"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CaretLeftIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FolderOpenIcon,
  ClockCountdownIcon,
  ListChecksIcon,
  DesktopIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useProject } from "@/hooks/use-projects";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Project, ProjectTask, ProjectSubscription, TaskStatus, TicketPriority } from "@/data/types";
import { cn } from "@/lib/utils";

type Tab = "tasks" | "timeline" | "files" | "tech-stack" | "overview";

const taskColumns: { status: TaskStatus; label: string; dotColor: string }[] = [
  { status: "To Do", label: "To Do", dotColor: "bg-text-muted" },
  { status: "In Progress", label: "In Progress", dotColor: "bg-blue" },
  { status: "Review", label: "Review", dotColor: "bg-warning" },
  { status: "Complete", label: "Complete", dotColor: "bg-success" },
];

const priorityBarColor: Record<TicketPriority, string> = {
  Critical: "bg-error",
  High: "bg-warning",
  Medium: "bg-blue",
  Low: "bg-text-muted",
};

const CHART_COLORS = ["#15549D", "#F0F2F5"];

/* ------------------------------------------------------------------ */
/*  Helper: parse "Mon DD, YYYY" string to a Date                      */
/* ------------------------------------------------------------------ */
function parseDate(str: string): Date {
  return new Date(str.replace(",", ""));
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: rawData, isLoading, error } = useProject(projectId);
  const project = (rawData as any)?.data as Project | undefined;

  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-text-muted">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-ice-30 flex items-center justify-center mb-4">
          <FolderOpenIcon size={28} weight="light" className="text-text-muted" />
        </div>
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary mb-1">
          Project not found
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          The project with ID &ldquo;{projectId}&rdquo; does not exist.
        </p>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm font-medium text-blue hover:underline"
        >
          <CaretLeftIcon size={14} weight="light" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "timeline", label: "Timeline" },
    { key: "files", label: "Files" },
    { key: "tech-stack", label: "Tech Stack" },
    { key: "overview", label: "Overview" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Back link ── */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue hover:underline"
      >
        <CaretLeftIcon size={14} weight="light" />
        Back to Projects
      </Link>

      {/* ── Project Header ── */}
      <div>
        <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] leading-tight text-text-primary">
          {project.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <StatusBadge status={project.status} />
          <div className="flex items-center gap-1.5 text-text-secondary">
            <CalendarBlankIcon size={14} weight="light" />
            <span className="text-xs">Due {project.dueDate}</span>
          </div>
          <div className="flex items-center -space-x-2">
            {project.assignees.slice(0, 5).map((a, i) => (
              <div
                key={a.initials + i}
                className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center ring-2 ring-white"
                title={`${a.name} - ${a.role}`}
              >
                <span className="text-[8px] text-white font-medium leading-none">
                  {a.initials}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="border-b border-ice">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key
                  ? "text-blue"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "tasks" && <TasksTab project={project} />}
      {activeTab === "timeline" && <TimelineTab project={project} />}
      {activeTab === "files" && <FilesTab />}
      {activeTab === "tech-stack" && <TechStackTab techStack={project.techStack ?? []} />}
      {activeTab === "overview" && <OverviewTab project={project} />}
    </div>
  );
}

/* ================================================================== */
/*  Tasks Tab (Kanban Board)                                           */
/* ================================================================== */
function TasksTab({ project }: { project: Project }) {
  const groupedTasks = useMemo(() => {
    const map: Record<TaskStatus, ProjectTask[]> = {
      "To Do": [],
      "In Progress": [],
      Review: [],
      Complete: [],
    };
    for (const task of project.tasks) {
      map[task.status].push(task);
    }
    return map;
  }, [project.tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {taskColumns.map((col) => (
        <div key={col.status}>
          {/* Column header */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn("w-2 h-2 rounded-full shrink-0", col.dotColor)}
            />
            <span className="text-[13px] font-semibold text-text-primary">
              {col.label}
            </span>
            <span className="text-[11px] font-medium text-text-muted bg-ice-30 px-2 py-0.5 rounded-full">
              {groupedTasks[col.status].length}
            </span>
          </div>

          {/* Task cards */}
          <div className="space-y-3">
            {groupedTasks[col.status].map((task) => (
              <div
                key={task.id}
                className="bg-white border border-ice rounded-lg p-3.5 hover:shadow-level-1 transition-shadow"
              >
                {/* Priority bar */}
                <div
                  className={cn(
                    "w-full h-[3px] rounded-full mb-2.5",
                    priorityBarColor[task.priority]
                  )}
                />

                {/* Task name */}
                <p className="text-[13px] font-medium text-text-primary leading-snug">
                  {task.name}
                </p>

                {/* Bottom row: avatar + due date */}
                <div className="flex items-center justify-between mt-3">
                  <div
                    className="w-5 h-5 rounded-full bg-navy-80 flex items-center justify-center"
                    title={task.assignee.name}
                  >
                    <span className="text-[7px] text-white font-medium leading-none">
                      {task.assignee.initials}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted">
                    <CalendarBlankIcon size={11} weight="light" />
                    <span className="text-[11px]">{task.dueDate}</span>
                  </div>
                </div>
              </div>
            ))}
            {groupedTasks[col.status].length === 0 && (
              <div className="text-center py-6 text-xs text-text-muted">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Timeline Tab                                                       */
/* ================================================================== */
function TimelineTab({ project }: { project: Project }) {
  /* Calculate bounds from project tasks */
  const tasks = project.tasks;
  const allDates = tasks.map((t) => parseDate(t.dueDate).getTime());
  const projectStart = parseDate(project.startDate).getTime();
  const projectEnd = parseDate(project.dueDate).getTime();
  const earliest = Math.min(projectStart, ...allDates);
  const latest = Math.max(projectEnd, ...allDates);
  const span = latest - earliest || 1;
  const today = new Date().getTime();
  const todayPct = ((today - earliest) / span) * 100;

  /* Generate month labels */
  const monthLabels: { label: string; leftPct: number }[] = [];
  const cursor = new Date(earliest);
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  while (cursor.getTime() < latest) {
    const p = ((cursor.getTime() - earliest) / span) * 100;
    monthLabels.push({
      label: cursor.toLocaleDateString("en-US", { month: "short" }),
      leftPct: p,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  /* Use a color based on task status */
  const statusBarColor: Record<TaskStatus, string> = {
    Complete: "bg-success",
    "In Progress": "bg-blue",
    Review: "bg-warning",
    "To Do": "bg-text-muted",
  };

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 overflow-x-auto">
      <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base mb-5">
        Task Timeline
      </h3>

      {/* Month header */}
      <div className="relative h-6 mb-2 ml-[220px]">
        {monthLabels.map((m) => (
          <span
            key={m.label + m.leftPct}
            className="absolute text-[10px] text-text-muted font-medium"
            style={{ left: `${m.leftPct}%`, transform: "translateX(-50%)" }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Task rows */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const taskDue = parseDate(task.dueDate).getTime();
          /* Approximate task start as 14 days before due */
          const taskStart = Math.max(
            earliest,
            taskDue - 14 * 24 * 60 * 60 * 1000
          );
          const barLeft = ((taskStart - earliest) / span) * 100;
          const barWidth = Math.max(
            ((taskDue - taskStart) / span) * 100,
            2
          );

          return (
            <div key={task.id} className="flex items-center group">
              {/* Task name */}
              <div className="w-[220px] shrink-0 pr-4">
                <span className="text-[12px] font-medium text-text-primary truncate block leading-snug">
                  {task.name}
                </span>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative h-6 min-w-[400px]">
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full transition-all",
                    statusBarColor[task.status]
                  )}
                  style={{
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    opacity: task.status === "To Do" ? 0.4 : 1,
                  }}
                />

                {/* Today line */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-error"
                    style={{ left: `${todayPct}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      {todayPct >= 0 && todayPct <= 100 && (
        <div className="relative ml-[220px] mt-2">
          <span
            className="absolute text-[10px] text-error font-medium"
            style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
          >
            Today
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-ice">
        {taskColumns.map((col) => (
          <div key={col.status} className="flex items-center gap-1.5">
            <span
              className={cn("w-2.5 h-2.5 rounded-sm", col.dotColor)}
            />
            <span className="text-[11px] text-text-secondary">
              {col.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Files Tab                                                          */
/* ================================================================== */
function FilesTab() {
  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-ice-30 flex items-center justify-center mb-4">
        <FolderOpenIcon size={24} weight="light" className="text-text-muted" />
      </div>
      <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-1">
        No project files uploaded yet
      </h3>
      <p className="text-sm text-text-secondary max-w-xs">
        Files related to this project will appear here once they are uploaded by
        the team.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Tech Stack Tab                                                     */
/* ================================================================== */
function TechStackTab({ techStack }: { techStack: ProjectSubscription[] }) {
  const [items, setItems] = useState(techStack);

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((s) => s.id !== id));
  };

  const totalCost = items.reduce((sum, s) => {
    const num = parseFloat(s.costPerMonth.replace(/[$,]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const expiringSoon = items.filter((s) => s.status === "Expiring Soon").length;

  const statusColor: Record<string, string> = {
    Active: "text-success bg-success-tint",
    "Expiring Soon": "text-warning bg-warning-tint",
    Expired: "text-error bg-error-tint",
  };

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-ice/40 shadow-level-1 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ice-30 flex items-center justify-center">
              <DesktopIcon size={16} weight="light" className="text-navy" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">{items.length}</p>
              <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">Total Software</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ice/40 shadow-level-1 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-success-tint flex items-center justify-center">
              <CheckCircleIcon size={16} weight="light" className="text-success" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">
                {items.filter((s) => s.status === "Active").length}
              </p>
              <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">Active</p>
              {expiringSoon > 0 && (
                <p className="text-[10px] text-warning font-medium">{expiringSoon} expiring soon</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-ice/40 shadow-level-1 p-5 col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-10 flex items-center justify-center">
              <span className="text-xs font-bold text-blue">$</span>
            </div>
            <div>
              <p className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary">
                ${totalCost.toLocaleString()}
              </p>
              <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">Monthly Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-navy rounded-full" />
            <div className="flex items-center gap-2">
              <DesktopIcon size={16} weight="light" className="text-text-secondary" />
              <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
                Software & Subscriptions
              </h3>
              <span className="text-[11px] font-medium text-text-muted bg-ice-30 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue hover:bg-blue-10 rounded-lg transition-colors">
            <PlusIcon size={14} weight="light" />
            Add Subscription
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-6 pb-8 pt-4 text-center">
            <p className="text-sm text-text-muted">No subscriptions added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-ice">
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3">
                    Software
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">
                    Licenses
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">
                    Cost/Month
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">
                    Renewal
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-t border-ice hover:bg-ice-30/50 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ice-30 flex items-center justify-center shrink-0">
                          <DesktopIcon size={14} weight="light" className="text-text-secondary" />
                        </div>
                        <span className="text-[13px] font-medium text-text-primary">{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-secondary">{sub.licenses}</td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-text-primary">{sub.costPerMonth}</td>
                    <td className="px-4 py-3.5 text-[13px] text-text-secondary">{sub.renewalDate}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                          statusColor[sub.status]
                        )}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleRemove(sub.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error hover:bg-error-tint rounded-md transition-all"
                        title="Remove subscription"
                      >
                        <TrashIcon size={14} weight="light" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Overview Tab                                                       */
/* ================================================================== */
function OverviewTab({ project }: { project: Project }) {
  const chartData = [
    { name: "Complete", value: project.tasksCompleted },
    { name: "Remaining", value: project.totalTasks - project.tasksCompleted },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Description + dates + team */}
      <div className="lg:col-span-2 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-2">
            Description
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Key Dates */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">
            Key Dates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-10 flex items-center justify-center shrink-0">
                <CalendarBlankIcon size={16} weight="light" className="text-blue" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">
                  Start Date
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {project.startDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-error-tint flex items-center justify-center shrink-0">
                <ClockCountdownIcon size={16} weight="light" className="text-error" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">
                  Due Date
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {project.dueDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success-tint flex items-center justify-center shrink-0">
                <ListChecksIcon size={16} weight="light" className="text-success" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted">
                  Category
                </p>
                <p className="text-sm font-medium text-text-primary">
                  {project.category}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4">
            Team
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.assignees.map((member, i) => (
              <div
                key={member.initials + i}
                className="flex items-center gap-3 p-3 rounded-lg border border-ice"
              >
                <div className="w-8 h-8 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white font-medium leading-none">
                    {member.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-text-primary truncate">
                    {member.name}
                  </p>
                  <p className="text-[11px] text-text-muted">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Donut chart */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 flex flex-col items-center">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary mb-4 self-start">
            Completion
          </h3>
          <div className="relative w-[120px] h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-[family-name:var(--font-aptos)] font-bold text-lg text-navy">
                {project.progress}%
              </span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-3">
            {project.tasksCompleted} of {project.totalTasks} tasks complete
          </p>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 space-y-4">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
            Quick Stats
          </h3>
          {taskColumns.map((col) => {
            const count = project.tasks.filter(
              (t) => t.status === col.status
            ).length;
            return (
              <div key={col.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("w-2 h-2 rounded-full", col.dotColor)}
                  />
                  <span className="text-[13px] text-text-secondary">
                    {col.label}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-text-primary">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
