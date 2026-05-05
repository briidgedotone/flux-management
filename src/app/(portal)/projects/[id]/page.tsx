"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CaretLeftIcon, CalendarBlankIcon, CheckCircleIcon,
  FolderOpenIcon, ClockCountdownIcon, PlusIcon, TrashIcon,
  ListChecksIcon,
} from "@phosphor-icons/react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { useProject, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-projects";
import { KpiCard } from "@/components/shared/kpi-card";
import type { Project, ProjectTask, TaskStatus, TicketPriority } from "@/data/types";
import { cn } from "@/lib/utils";

type Tab = "tasks" | "overview";

const taskColumns: { status: TaskStatus; label: string; dotColor: string; bgColor: string }[] = [
  { status: "To Do", label: "To Do", dotColor: "bg-text-muted", bgColor: "bg-ice-30/50" },
  { status: "In Progress", label: "In Progress", dotColor: "bg-blue", bgColor: "bg-blue-10/50" },
  { status: "Review", label: "Review", dotColor: "bg-warning", bgColor: "bg-warning/5" },
  { status: "Complete", label: "Complete", dotColor: "bg-success", bgColor: "bg-success-tint/50" },
];

const priorityBarColor: Record<TicketPriority, string> = {
  Critical: "bg-error", High: "bg-warning", Medium: "bg-blue", Low: "bg-text-muted",
};

const CHART_COLORS = ["#15549D", "#F0F2F5"];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: rawData, isLoading, error } = useProject(projectId);
  const project = rawData as Project | undefined;
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><p className="text-sm text-text-muted">Loading project...</p></div>;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FolderOpenIcon size={48} weight="light" className="text-text-muted mb-4" />
        <h2 className="font-[family-name:var(--font-aptos)] font-bold text-xl text-text-primary mb-1">Project not found</h2>
        <Link href="/projects" className="text-sm text-blue hover:underline mt-4"><CaretLeftIcon size={14} weight="light" className="inline" /> Back to Projects</Link>
      </div>
    );
  }

  const statusColor = project.status === "On Track" ? "text-success" : project.status === "At Risk" ? "text-warning" : "text-error";
  const statusDot = project.status === "On Track" ? "bg-success" : project.status === "At Risk" ? "bg-warning" : "bg-error";
  const taskCounts = { todo: 0, inProgress: 0, review: 0, complete: 0 };
  project.tasks.forEach((t) => {
    if (t.status === "To Do") taskCounts.todo++;
    else if (t.status === "In Progress") taskCounts.inProgress++;
    else if (t.status === "Review") taskCounts.review++;
    else if (t.status === "Complete") taskCounts.complete++;
  });

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-blue transition-colors">
        <CaretLeftIcon size={14} weight="light" /> Back to Projects
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-7">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Left: Title + Meta */}
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-aptos)] font-bold text-[24px] leading-tight tracking-[-0.02em] text-text-primary">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              <span className={cn("flex items-center gap-1.5 text-[12px] font-medium", statusColor)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusDot)} />
                {project.status}
              </span>
              <span className="text-[12px] text-text-muted">•</span>
              <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <CalendarBlankIcon size={13} weight="light" />
                {project.startDate} → {project.dueDate}
              </span>
              {project.clientName && (
                <>
                  <span className="text-[12px] text-text-muted">•</span>
                  <span className="text-[12px] text-text-secondary">{project.clientName}</span>
                </>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">{project.description}</p>
            )}
          </div>

          {/* Right: Completion Ring */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-[72px] h-[72px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: project.tasksCompleted },
                      { value: Math.max(0, project.totalTasks - project.tasksCompleted) },
                    ]}
                    cx="50%" cy="50%" innerRadius={26} outerRadius={34}
                    paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270} stroke="none"
                  >
                    <Cell fill="#15549D" />
                    <Cell fill="#F0F2F5" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[family-name:var(--font-aptos)] font-bold text-[15px] text-navy">{project.progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text-primary">{project.tasksCompleted}/{project.totalTasks}</p>
              <p className="text-[11px] text-text-muted">tasks done</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<ListChecksIcon size={20} weight="light" />} value={String(taskCounts.todo)} label="To Do" iconBgClass="bg-ice-30" iconColorClass="text-text-muted" index={0} />
        <KpiCard icon={<ClockCountdownIcon size={20} weight="light" />} value={String(taskCounts.inProgress)} label="In Progress" iconBgClass="bg-blue-10" iconColorClass="text-blue" index={1} />
        <KpiCard icon={<CheckCircleIcon size={20} weight="light" />} value={String(taskCounts.review)} label="In Review" iconBgClass="bg-warning/10" iconColorClass="text-warning" index={2} />
        <KpiCard icon={<CheckCircleIcon size={20} weight="light" />} value={String(taskCounts.complete)} label="Complete" iconBgClass="bg-success-tint" iconColorClass="text-success" index={3} />
      </div>

      {/* Tab Bar */}
      <div className="border-b border-ice">
        <div className="flex gap-6">
          {([{ key: "tasks" as const, label: "Tasks" }, { key: "overview" as const, label: "Overview" }]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("pb-3 text-sm font-medium transition-colors relative",
                activeTab === tab.key ? "text-blue" : "text-text-muted hover:text-text-secondary"
              )}>
              {tab.label}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "tasks" && <TasksTab project={project} />}
      {activeTab === "overview" && <OverviewTab project={project} />}
    </div>
  );
}

/* ── Tasks Tab ── */
function TasksTab({ project }: { project: Project }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const groupedTasks = useMemo(() => {
    const map: Record<TaskStatus, ProjectTask[]> = { "To Do": [], "In Progress": [], Review: [], Complete: [] };
    for (const task of project.tasks) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [project.tasks]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 h-9 px-4 text-xs font-medium text-white bg-blue hover:bg-blue-light rounded-lg transition-colors">
          <PlusIcon size={14} weight="bold" /> Add Task
        </button>
      </div>

      {showAddForm && <AddTaskForm projectId={project.id} onClose={() => setShowAddForm(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {taskColumns.map((col) => (
          <div key={col.status} className={cn("rounded-xl p-4 min-h-[200px]", col.bgColor)}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("w-2 h-2 rounded-full shrink-0", col.dotColor)} />
              <span className="text-[13px] font-semibold text-text-primary">{col.label}</span>
              <span className="text-[11px] font-medium text-text-muted bg-white/80 px-2 py-0.5 rounded-full">
                {groupedTasks[col.status].length}
              </span>
            </div>
            <div className="space-y-2.5">
              {groupedTasks[col.status].map((task) => (
                <TaskCard key={task.id} task={task} projectId={project.id}
                  isEditing={editingTaskId === task.id}
                  onEdit={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                  onClose={() => setEditingTaskId(null)} />
              ))}
              {groupedTasks[col.status].length === 0 && (
                <p className="text-center py-8 text-[11px] text-text-muted">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, projectId, isEditing, onEdit, onClose }: {
  task: ProjectTask; projectId: string; isEditing: boolean; onEdit: () => void; onClose: () => void;
}) {
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  return (
    <div className="bg-white rounded-lg p-3.5 shadow-sm hover:shadow-level-1 transition-all cursor-pointer border border-ice/30" onClick={onEdit}>
      <div className={cn("w-full h-[3px] rounded-full mb-2", priorityBarColor[task.priority])} />
      <p className="text-[13px] font-medium text-text-primary leading-snug">{task.name}</p>

      {isEditing && (
        <div className="mt-2.5 pt-2.5 border-t border-ice/60 space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap gap-1">
            {(["To Do", "In Progress", "Review", "Complete"] as TaskStatus[]).map((s) => (
              <button key={s} onClick={() => { updateMutation.mutate({ projectId, taskId: task.id, data: { status: s } }); onClose(); }}
                disabled={task.status === s}
                className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  task.status === s ? "bg-blue text-white border-blue" : "border-ice text-text-muted hover:border-blue hover:text-blue"
                )}>{s}</button>
            ))}
          </div>
          <button onClick={() => { if (confirm(`Delete "${task.name}"?`)) deleteMutation.mutate({ projectId, taskId: task.id }); }}
            className="flex items-center gap-1 text-[10px] text-error hover:underline">
            <TrashIcon size={10} weight="light" /> Delete
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="w-5 h-5 rounded-full bg-navy-80 flex items-center justify-center" title={task.assignedToName ?? "Unassigned"}>
          <span className="text-[7px] text-white font-medium leading-none">
            {task.assignedToName ? String(task.assignedToName).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
          </span>
        </div>
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <CalendarBlankIcon size={10} weight="light" />{task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}

function AddTaskForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createMutation = useCreateTask();
  const [form, setForm] = useState({ name: "", priority: "Medium", dueDate: "", assignedToName: "", assignedToEmail: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate({
      projectId,
      data: { name: form.name.trim(), priority: form.priority, dueDate: form.dueDate || undefined, assignedToName: form.assignedToName || undefined, assignedToEmail: form.assignedToEmail || undefined, status: "To Do" },
    }, {
      onSuccess: () => { setForm({ name: "", priority: "Medium", dueDate: "", assignedToName: "", assignedToEmail: "" }); onClose(); },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-level-1 border border-ice/40 p-5 space-y-3">
      <p className="text-sm font-semibold text-text-primary">New Task</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
          placeholder="Task name *" className="col-span-2 h-9 px-3 text-xs rounded-lg border border-ice focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none" />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="h-9 px-3 text-xs rounded-lg border border-ice bg-white">
          <option value="Critical">Critical</option><option value="High">High</option>
          <option value="Medium">Medium</option><option value="Low">Low</option>
        </select>
        <input value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          type="date" className="h-9 px-3 text-xs rounded-lg border border-ice" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.assignedToName} onChange={(e) => setForm({ ...form, assignedToName: e.target.value })}
          placeholder="Assignee name" className="h-9 px-3 text-xs rounded-lg border border-ice" />
        <input value={form.assignedToEmail} onChange={(e) => setForm({ ...form, assignedToEmail: e.target.value })}
          type="email" placeholder="Assignee email" className="h-9 px-3 text-xs rounded-lg border border-ice" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={createMutation.isPending}
          className="h-9 px-4 text-xs font-medium bg-blue text-white rounded-lg hover:bg-blue-light transition-colors disabled:opacity-50">
          {createMutation.isPending ? "Adding..." : "Add Task"}
        </button>
        <button type="button" onClick={onClose} className="h-9 px-3 text-xs text-text-muted hover:text-text-primary">Cancel</button>
      </div>
    </form>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ project }: { project: Project }) {
  const chartData = [
    { name: "Complete", value: project.tasksCompleted },
    { name: "Remaining", value: Math.max(0, project.totalTasks - project.tasksCompleted) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Dates + Team */}
      <div className="lg:col-span-2 space-y-5">
        {/* Key Dates */}
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-4">Key Dates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DateInfo icon={<CalendarBlankIcon size={15} weight="light" />} iconBg="bg-blue-10" iconColor="text-blue" label="Start Date" value={project.startDate} />
            <DateInfo icon={<ClockCountdownIcon size={15} weight="light" />} iconBg="bg-error/10" iconColor="text-error" label="Due Date" value={project.dueDate} />
            <DateInfo icon={<ListChecksIcon size={15} weight="light" />} iconBg="bg-success-tint" iconColor="text-success" label="Category" value={project.category || "—"} />
          </div>
        </div>

        {/* Team */}
        {project.assignees.length > 0 && (
          <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6">
            <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-4">Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.assignees.map((m, i) => (
                <div key={m.initials + i} className="flex items-center gap-3 p-3 rounded-xl bg-ice-30/40">
                  <div className="w-8 h-8 rounded-full bg-navy-80 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-white font-medium">{m.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">{m.name}</p>
                    <p className="text-[11px] text-text-muted">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Completion + Stats */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 flex flex-col items-center">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mb-4 self-start">Completion</h3>
          <div className="relative w-[110px] h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={36} outerRadius={50}
                  paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-[family-name:var(--font-aptos)] font-bold text-lg text-navy">{project.progress}%</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-3">{project.tasksCompleted} of {project.totalTasks} tasks complete</p>
        </div>

        <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 p-6 space-y-3.5">
          <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">Task Breakdown</h3>
          {taskColumns.map((col) => {
            const count = project.tasks.filter((t) => t.status === col.status).length;
            return (
              <div key={col.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                  <span className="text-[13px] text-text-secondary">{col.label}</span>
                </div>
                <span className="text-[13px] font-semibold text-text-primary tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DateInfo({ icon, iconBg, iconColor, label, value }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.06em] font-medium text-text-muted">{label}</p>
        <p className="text-[13px] font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}
