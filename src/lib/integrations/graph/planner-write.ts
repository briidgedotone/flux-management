// Planner task write-back — create, update, delete tasks in Microsoft Planner
// R33: Background and non-blocking — DB write succeeds even if Planner fails
// R34: Never modify plans or buckets — only individual tasks
// EA §Planner Write-Back: rules 1-6

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET ?? "";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// Token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/** Get Graph API token via client credentials flow. */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 300_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`Graph token failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

/** Make an authenticated Graph API request with retry on 429. */
async function graphRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<unknown> {
  const token = await getToken();

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 30_000)));
      continue;
    }

    if (res.status === 204) return null; // DELETE success
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph ${method} ${path} failed: ${res.status} ${text}`);
    }

    return res.json();
  }

  throw new Error(`Graph API retry exhausted for ${method} ${path}`);
}

interface PlannerTaskData {
  name: string;
  bucketId?: string;
  assigneeEmail?: string;
  dueDate?: string;
  priority?: number; // 1=Urgent, 3=Important, 5=Medium, 9=Low
}

/** Create a task in Planner. [R34: only tasks, never plans/buckets] */
export async function createPlannerTask(planId: string, data: PlannerTaskData) {
  const taskBody: Record<string, unknown> = {
    planId,
    title: data.name,
  };

  if (data.bucketId) taskBody.bucketId = data.bucketId;
  if (data.dueDate) taskBody.dueDateTime = new Date(data.dueDate).toISOString();
  if (data.priority) taskBody.priority = data.priority;

  return graphRequest("POST", "/planner/tasks", taskBody);
}

/** Fetch the ETag for a Planner task (required for update/delete). */
async function getPlannerTaskEtag(taskId: string): Promise<string> {
  const token = await getToken();
  const res = await fetch(`${GRAPH_BASE}/planner/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch task etag: ${res.status}`);
  const data = (await res.json()) as { "@odata.etag": string };
  return data["@odata.etag"];
}

/** Update a task in Planner. Fetches etag automatically. [R34: only tasks] */
export async function updatePlannerTask(
  taskId: string,
  data: Partial<PlannerTaskData>,
) {
  const etag = await getPlannerTaskEtag(taskId);

  const taskBody: Record<string, unknown> = {};
  if (data.name) taskBody.title = data.name;
  if (data.dueDate) taskBody.dueDateTime = new Date(data.dueDate).toISOString();
  if (data.priority) taskBody.priority = data.priority;

  return graphRequest("PATCH", `/planner/tasks/${taskId}`, taskBody, { "If-Match": etag });
}

/** Delete a task from Planner. Fetches etag automatically. [R34: only tasks] */
export async function deletePlannerTask(taskId: string) {
  const etag = await getPlannerTaskEtag(taskId);
  const token = await getToken();
  const res = await fetch(`${GRAPH_BASE}/planner/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "If-Match": etag,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Planner DELETE failed: ${res.status} ${text}`);
  }
}

/**
 * Background Planner write — fire and forget. [R33: non-blocking]
 * Logs errors but never throws. DB write has already succeeded.
 */
export function backgroundPlannerWrite(
  action: "create" | "update" | "delete",
  fn: () => Promise<unknown>,
) {
  fn().catch((err) => {
    console.error(`[planner-write] background ${action} failed:`, (err as Error).message);
  });
}
