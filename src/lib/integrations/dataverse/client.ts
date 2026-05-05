// Dataverse Web API client for Planner Premium write-back
// Uses client portal app registration (has Dataverse access)
// R33: All writes are background and non-blocking

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "";
const CLIENT_ID = process.env.DATAVERSE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.DATAVERSE_CLIENT_SECRET ?? "";
const DATAVERSE_URL = process.env.DATAVERSE_URL ?? "";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 300_000) {
    return cachedToken;
  }

  if (!CLIENT_ID || !DATAVERSE_URL) {
    throw new Error("Dataverse credentials not configured");
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: `${DATAVERSE_URL}/.default`,
    grant_type: "client_credentials",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Dataverse token failed: ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

const headers = {
  "OData-MaxVersion": "4.0",
  "OData-Version": "4.0",
  "Content-Type": "application/json",
};

/** POST to Dataverse — create an entity. Returns the created entity ID from the OData-EntityId header. */
export async function dataversePost(path: string, body: Record<string, unknown>): Promise<string | null> {
  const token = await getToken();
  const res = await fetch(`${DATAVERSE_URL}${path}`, {
    method: "POST",
    headers: { ...headers, Authorization: `Bearer ${token}`, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dataverse POST ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }

  // Extract entity ID from response
  const data = await res.json();
  return data?.msdyn_projecttaskid ?? null;
}

/** PATCH to Dataverse — update an entity. */
export async function dataversePatch(path: string, body: Record<string, unknown>): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${DATAVERSE_URL}${path}`, {
    method: "PATCH",
    headers: { ...headers, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dataverse PATCH ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
}

/** DELETE from Dataverse. */
export async function dataverseDelete(path: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`${DATAVERSE_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "OData-Version": "4.0" },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Dataverse DELETE ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
}
