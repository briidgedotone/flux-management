"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  KanbanIcon,
  CheckCircleIcon,
  ChartPieIcon,
  GridFourIcon,
  RowsIcon,
  ChartLineIcon,
  CalendarBlankIcon,
  DotsThreeVerticalIcon,
} from "@phosphor-icons/react";
import { useProjects } from "@/hooks/use-projects";
import type { Project, ProjectStatus } from "@/data/types";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "list" | "timeline";

const statusDotColor: Record<ProjectStatus, string> = {
  "On Track": "bg-success",
  "At Risk": "bg-warning",
  Delayed: "bg-error",
};

const priorityBarColor: Record<string, string> = {
  Critical: "bg-error",
  High: "bg-warning",
  Medium: "bg-blue",
  Low: "bg-text-muted",
};

/* ------------------------------------------------------------------ */
/*  Helper: parse "Mon DD, YYYY" string to a Date                      */
/* ------------------------------------------------------------------ */
function parseDate(str: string): Date {
  return new Date(str.replace(",", ""));
}

/* ------------------------------------------------------------------ */
/*  Timeline helpers                                                    */
/* ------------------------------------------------------------------ */
function getTimelineBounds(projects: Project[]) {
  let earliest = Infinity;
  let latest = -Infinity;
  for (const p of projects) {
    const s = parseDate(p.startDate).getTime();
    const e = parseDate(p.dueDate).getTime();
    if (s < earliest) earliest = s;
    if (e > latest) latest = e;
  }
  return { earliest, latest, span: latest - earliest };
}

function pct(value: number, earliest: number, span: number) {
  return ((value - earliest) / span) * 100;
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */
export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const { data: rawData, isLoading, error } = useProjects();
  const projects = (rawData as any)?.data as Project[] ?? [];

  /* KPI calculations */
  const activeCount = projects.filter(
    (p) => p.status === "On Track" || p.status === "At Risk"
  ).length;

  const totalCompleted = projects.reduce(
    (sum, p) => sum + p.tasksCompleted,
    0
  );
  const totalTasks = projects.reduce((sum, p) => sum + p.totalTasks, 0);

  const onTrackCount = projects.filter(
    (p) => p.status === "On Track"
  ).length;
  const onTrackPct =
    projects.length > 0
      ? Math.round((onTrackCount / projects.length) * 100)
      : 0;

  /* View toggle buttons config */
  const viewButtons: { mode: ViewMode; icon: typeof GridFourIcon; label: string }[] = [
    { mode: "cards", icon: GridFourIcon, label: "Cards" },
    { mode: "list", icon: RowsIcon, label: "List" },
    { mode: "timeline", icon: ChartLineIcon, label: "Timeline" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Projects"
        subtitle="Track all client projects and milestones"
        actions={
          <div className="flex items-center bg-ice-30 rounded-lg p-0.5">
            {viewButtons.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150",
                  viewMode === mode
                    ? "bg-blue-10 text-blue shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                )}
              >
                <Icon size={18} weight={viewMode === mode ? "fill" : "light"} />
              </button>
            ))}
          </div>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          icon={<KanbanIcon size={20} weight="light" />}
          value={String(activeCount)}
          label="Active Projects"
          iconBgClass="bg-blue-10"
          iconColorClass="text-blue"
          index={0}
        />
        <KpiCard
          icon={<CheckCircleIcon size={20} weight="light" />}
          value={`${totalCompleted}/${totalTasks}`}
          label="Tasks Completed"
          iconBgClass="bg-success-tint"
          iconColorClass="text-success"
          index={1}
        />
        <KpiCard
          icon={<ChartPieIcon size={20} weight="light" />}
          value={`${onTrackPct}%`}
          label="On Track"
          iconBgClass="bg-success-tint"
          iconColorClass="text-success"
          index={2}
        />
      </div>

      {/* ── View Body ── */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-text-muted">Loading projects...</div>
      )}
      {error && (
        <div className="text-center py-12 text-sm text-error">Failed to load projects.</div>
      )}
      {!isLoading && !error && viewMode === "cards" && <CardsView projects={projects} />}
      {!isLoading && !error && viewMode === "list" && <ListView projects={projects} />}
      {!isLoading && !error && viewMode === "timeline" && <TimelineView projects={projects} />}
    </div>
  );
}

/* ================================================================== */
/*  Cards View                                                         */
/* ================================================================== */
function CardsView({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {projects.map((project, idx) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.06, ease: "easeOut" }}
        >
          <Link href={`/projects/${project.id}`} className="block">
            <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 transition-all duration-200 hover:shadow-level-2 hover:-translate-y-[2px] cursor-pointer">
              {/* Top row: status + overflow */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      statusDotColor[project.status]
                    )}
                  />
                  <span className="text-xs font-medium text-text-secondary">
                    {project.status}
                  </span>
                </div>
                <button
                  onClick={(e) => e.preventDefault()}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-ice-30 transition-colors text-text-muted"
                >
                  <DotsThreeVerticalIcon size={18} weight="light" />
                </button>
              </div>

              {/* Project name */}
              <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-navy mt-3 leading-snug line-clamp-1">
                {project.name}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">{project.clientName}</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full h-2 rounded-full bg-ice-30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-1.5">
                  {project.tasksCompleted} of {project.totalTasks} tasks
                  complete
                </p>
              </div>

              {/* Bottom row: date + avatars */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <CalendarBlankIcon size={14} weight="light" />
                  <span className="text-xs">{project.dueDate}</span>
                </div>

                {/* Stacked avatars */}
                <div className="flex items-center -space-x-2">
                  {project.assignees.slice(0, 4).map((a, i) => (
                    <div
                      key={a.initials + i}
                      className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center ring-2 ring-white"
                      title={a.name}
                    >
                      <span className="text-[8px] text-white font-medium leading-none">
                        {a.initials}
                      </span>
                    </div>
                  ))}
                  {project.assignees.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-ice-30 flex items-center justify-center ring-2 ring-white">
                      <span className="text-[8px] text-text-secondary font-medium leading-none">
                        +{project.assignees.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  List View                                                          */
/* ================================================================== */
function ListView({ projects }: { projects: Project[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-ice-30 h-11">
              <th className="px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                Project Name
              </th>
              <th className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted w-[110px]">
                Status
              </th>
              <th className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted w-[160px]">
                Progress
              </th>
              <th className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted w-[100px]">
                Tasks
              </th>
              <th className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted w-[120px]">
                Due Date
              </th>
              <th className="px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted w-[120px]">
                Assignees
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="contents"
              >
                <tr className="h-[52px] border-b border-silver-light cursor-pointer hover:bg-blue-10 transition-colors">
                  <td className="px-5">
                    <span className="font-[family-name:var(--font-aptos)] text-[13px] font-semibold text-navy">
                      {project.name}
                    </span>
                  </td>
                  <td className="px-4">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-ice-30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 text-xs text-text-secondary">
                    {project.tasksCompleted}/{project.totalTasks}
                  </td>
                  <td className="px-4 text-xs text-text-secondary">
                    {project.dueDate}
                  </td>
                  <td className="px-4">
                    <div className="flex items-center -space-x-2">
                      {project.assignees.slice(0, 3).map((a, i) => (
                        <div
                          key={a.initials + i}
                          className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center ring-2 ring-white"
                          title={a.name}
                        >
                          <span className="text-[8px] text-white font-medium leading-none">
                            {a.initials}
                          </span>
                        </div>
                      ))}
                      {project.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-ice-30 flex items-center justify-center ring-2 ring-white">
                          <span className="text-[8px] text-text-secondary font-medium leading-none">
                            +{project.assignees.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Timeline (Gantt) View                                              */
/* ================================================================== */
function TimelineView({ projects }: { projects: Project[] }) {
  const { earliest, latest, span } = getTimelineBounds(projects);
  const today = new Date().getTime();
  const todayPct = pct(today, earliest, span);

  /* Generate month labels across the timeline */
  const monthLabels: { label: string; leftPct: number }[] = [];
  const cursor = new Date(earliest);
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  while (cursor.getTime() < latest) {
    const p = pct(cursor.getTime(), earliest, span);
    monthLabels.push({
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      leftPct: p,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 overflow-x-auto">
      <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base mb-5">
        Project Timeline
      </h3>

      {/* Month header */}
      <div className="relative h-6 mb-2 ml-[200px]">
        {monthLabels.map((m) => (
          <span
            key={m.label}
            className="absolute text-[10px] text-text-muted font-medium"
            style={{ left: `${m.leftPct}%`, transform: "translateX(-50%)" }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {projects.map((project) => {
          const start = parseDate(project.startDate).getTime();
          const end = parseDate(project.dueDate).getTime();
          const barLeft = pct(start, earliest, span);
          const barWidth = pct(end, earliest, span) - barLeft;
          const completePortion = barWidth * (project.progress / 100);

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center group"
            >
              {/* Project name column */}
              <div className="w-[200px] shrink-0 pr-4">
                <span className="text-[13px] font-medium text-navy group-hover:text-blue transition-colors truncate block">
                  {project.name}
                </span>
                <span className="text-[10px] text-text-muted">
                  {project.progress}% complete
                </span>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative h-8 min-w-[400px]">
                {/* Background track */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-blue/20"
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
                {/* Completed fill */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-blue transition-all duration-500"
                  style={{
                    left: `${barLeft}%`,
                    width: `${completePortion}%`,
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
            </Link>
          );
        })}
      </div>

      {/* Today indicator label */}
      {todayPct >= 0 && todayPct <= 100 && (
        <div className="relative ml-[200px] mt-2">
          <span
            className="absolute text-[10px] text-error font-medium"
            style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
          >
            Today
          </span>
        </div>
      )}
    </div>
  );
}
