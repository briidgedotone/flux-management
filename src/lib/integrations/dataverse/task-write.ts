// Dataverse task write-back for Planner Premium
// Creates/updates/deletes tasks in Dataverse (msdyn_projecttasks)
// R33: Background and non-blocking — DB write succeeds even if Dataverse fails
// R34: Never modify projects or buckets — only individual tasks

import { dataversePost, dataversePatch, dataverseDelete } from "./client";

interface TaskWriteData {
  name: string;
  projectId: string; // Dataverse project ID (msdyn_projectid)
  priority?: "Critical" | "High" | "Medium" | "Low";
  dueDate?: string;
  status?: "To Do" | "In Progress" | "Review" | "Complete";
}

/** Map our priority to Dataverse priority (1=Urgent, 3=Important, 5=Medium, 9=Low) */
function mapPriority(priority?: string): number {
  switch (priority) {
    case "Critical": return 1;
    case "High": return 3;
    case "Medium": return 5;
    case "Low": return 9;
    default: return 5;
  }
}

/** Map our status to Dataverse progress (0 = not started, 0.5 = in progress, 1 = complete) */
function mapProgress(status?: string): number {
  switch (status) {
    case "To Do": return 0;
    case "In Progress": return 0.5;
    case "Review": return 0.75;
    case "Complete": return 1;
    default: return 0;
  }
}

/** Create a task in Dataverse Planner Premium. Returns the new task ID. */
export async function createDataverseTask(data: TaskWriteData): Promise<string | null> {
  const body: Record<string, unknown> = {
    msdyn_subject: data.name,
    "msdyn_project@odata.bind": `/msdyn_projects(${data.projectId})`,
    msdyn_priority: mapPriority(data.priority),
    msdyn_progress: mapProgress(data.status),
  };

  if (data.dueDate) {
    body.msdyn_scheduledend = new Date(data.dueDate).toISOString();
  }

  return dataversePost("/api/data/v9.2/msdyn_projecttasks", body);
}

/** Update a task in Dataverse Planner Premium. */
export async function updateDataverseTask(
  taskId: string,
  data: Partial<TaskWriteData>,
): Promise<void> {
  const body: Record<string, unknown> = {};

  if (data.name) body.msdyn_subject = data.name;
  if (data.priority) body.msdyn_priority = mapPriority(data.priority);
  if (data.status) body.msdyn_progress = mapProgress(data.status);
  if (data.dueDate) body.msdyn_scheduledend = new Date(data.dueDate).toISOString();

  if (Object.keys(body).length === 0) return;

  await dataversePatch(`/api/data/v9.2/msdyn_projecttasks(${taskId})`, body);
}

/** Delete a task from Dataverse Planner Premium. */
export async function deleteDataverseTask(taskId: string): Promise<void> {
  await dataverseDelete(`/api/data/v9.2/msdyn_projecttasks(${taskId})`);
}

/** Fire-and-forget wrapper. Logs errors but never throws. [R33] */
export function backgroundDataverseWrite(
  action: "create" | "update" | "delete",
  fn: () => Promise<unknown>,
) {
  fn().catch((err) => {
    console.error(`[dataverse-write] background ${action} failed:`, (err as Error).message);
  });
}
