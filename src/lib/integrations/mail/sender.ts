// Email notification sender via Graph API Mail.Send — Step 5.3
// R35: Email failures are non-blocking — log error, don't throw
// EA §Outlook Mail: Only send to Flux employees and known contacts, never bulk/marketing

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET ?? "";
const SENDER_EMAIL = process.env.NOTIFICATION_SENDER_EMAIL ?? "noreply@flux.tech";
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

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

  if (!res.ok) throw new Error(`Mail token failed: ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

/** Send email via Graph API Mail.Send. */
export async function sendEmail({ to, subject, htmlBody }: SendEmailParams): Promise<void> {
  const token = await getToken();

  const res = await fetch(`${GRAPH_BASE}/users/${SENDER_EMAIL}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mail send failed: ${res.status} ${text}`);
  }
}

/** Fire-and-forget email send. [R35: non-blocking, log errors] */
export function backgroundSendEmail(params: SendEmailParams) {
  sendEmail(params).catch((err) => {
    console.error("[mail] background send failed:", (err as Error).message);
  });
}

// --- Email templates for management notifications ---

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export function ticketEscalationEmail(recipientName: string, ticketNumber: string, subject: string, clientName: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #002B4D; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Flux Technologies — Ticket Escalation</h1>
    </div>
    <div style="padding: 24px; background: #fff; border: 1px solid #DDE0E6; border-top: none; border-radius: 0 0 8px 8px;">
      <p>Hi ${recipientName},</p>
      <p>A ticket has been escalated:</p>
      <p style="background: #FFF5F5; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #C53030;">
        <strong>${ticketNumber}</strong> — ${subject}<br/>
        <span style="color: #4A5568; font-size: 14px;">Client: ${clientName}</span>
      </p>
      <p><a href="${APP_URL}/tickets" style="color: #15549D;">View in Management Portal</a></p>
    </div>
  </div>`;
}

export function contactFormAlertEmail(recipientName: string, contactName: string, company: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #002B4D; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Flux Technologies — New Contact Form</h1>
    </div>
    <div style="padding: 24px; background: #fff; border: 1px solid #DDE0E6; border-top: none; border-radius: 0 0 8px 8px;">
      <p>Hi ${recipientName},</p>
      <p>New contact form submission from <strong>${contactName}</strong> (${company || "N/A"}).</p>
      <p><a href="${APP_URL}/contact-submissions" style="color: #15549D;">Review in Management Portal</a></p>
    </div>
  </div>`;
}

export function taskAssignmentEmail(recipientName: string, taskName: string, projectName: string, assignedBy: string): string {
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #002B4D; padding: 24px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Flux Technologies — Task Assignment</h1>
    </div>
    <div style="padding: 24px; background: #fff; border: 1px solid #DDE0E6; border-top: none; border-radius: 0 0 8px 8px;">
      <p>Hi ${recipientName},</p>
      <p>${assignedBy} assigned you a task: <strong>${taskName}</strong> in project ${projectName}.</p>
      <p><a href="${APP_URL}/projects" style="color: #15549D;">View in Management Portal</a></p>
    </div>
  </div>`;
}
