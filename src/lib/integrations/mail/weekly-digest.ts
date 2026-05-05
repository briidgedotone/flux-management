// Weekly digest email template — PRD R5, U11
// Renders an HTML email with ticket + project summary for the past 7 days

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

interface TicketStats {
  total: number;
  open: number;
  pending: number;
  closed: number;
  critical: number;
  high: number;
  createdInRange: number;
  resolvedInRange: number;
  avgResolutionHours: number;
}

interface ProjectStats {
  total: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
}

export function buildWeeklyDigestEmail(
  tickets: TicketStats,
  projects: ProjectStats,
): string {
  const resolutionRate =
    tickets.createdInRange > 0
      ? Math.round((tickets.resolvedInRange / tickets.createdInRange) * 100)
      : 0;

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #F7F8FA;">
  <!-- Header -->
  <div style="background: #002B4D; padding: 28px 32px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.02em;">
      Flux Technologies — Weekly Digest
    </h1>
    <p style="color: rgba(255,255,255,0.65); margin: 4px 0 0; font-size: 14px;">
      Summary for the past 7 days &middot; ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
    </p>
  </div>

  <div style="padding: 28px 32px; background: #fff; border: 1px solid #DDE0E6; border-top: none;">
    <!-- Tickets Section -->
    <h2 style="font-size: 16px; color: #1A202C; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #E8F0FA;">
      IT Help Desk
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        ${kpiCell("Created", String(tickets.createdInRange))}
        ${kpiCell("Resolved", String(tickets.resolvedInRange))}
        ${kpiCell("Open Now", String(tickets.open))}
        ${kpiCell("Critical", String(tickets.critical), tickets.critical > 0 ? "#C53030" : undefined)}
      </tr>
    </table>
    <p style="font-size: 14px; color: #4A5568; line-height: 1.6; margin: 0 0 8px;">
      Resolution rate: <strong>${resolutionRate}%</strong> &middot;
      Avg resolution time: <strong>${tickets.avgResolutionHours.toFixed(1)}h</strong>
    </p>
    ${tickets.critical > 0
      ? `<p style="font-size: 13px; color: #C53030; background: #FFF5F5; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #C53030; margin: 12px 0 0;">
          ${tickets.critical} critical ticket${tickets.critical > 1 ? "s" : ""} requiring attention.
        </p>`
      : ""
    }
    ${tickets.open > 0
      ? `<p style="font-size: 13px; color: #4A5568; margin: 8px 0 0;">
          ${tickets.open} ticket${tickets.open > 1 ? "s" : ""} remain open, ${tickets.pending} pending.
        </p>`
      : ""
    }

    <!-- Projects Section -->
    <h2 style="font-size: 16px; color: #1A202C; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #E8F0FA;">
      Projects
    </h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr>
        ${kpiCell("Total", String(projects.total))}
        ${kpiCell("On Track", String(projects.onTrack), "#0D7C5F")}
        ${kpiCell("At Risk", String(projects.atRisk), projects.atRisk > 0 ? "#B8860B" : undefined)}
        ${kpiCell("Delayed", String(projects.delayed), projects.delayed > 0 ? "#C53030" : undefined)}
      </tr>
    </table>
    ${projects.atRisk + projects.delayed > 0
      ? `<p style="font-size: 13px; color: #B8860B; background: #FFFBEB; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #B8860B; margin: 0;">
          ${projects.atRisk + projects.delayed} project${projects.atRisk + projects.delayed > 1 ? "s" : ""} need attention.
        </p>`
      : `<p style="font-size: 13px; color: #0D7C5F; margin: 0;">All projects on track.</p>`
    }

    <!-- CTA -->
    <div style="margin-top: 28px; text-align: center;">
      <a href="${APP_URL}/dashboard"
         style="display: inline-block; background: #15549D; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Open Dashboard
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 16px 32px; text-align: center; border-radius: 0 0 8px 8px;">
    <p style="font-size: 12px; color: #8896A6; margin: 0;">
      Flux Technologies Management Portal &middot;
      <a href="${APP_URL}/reports" style="color: #15549D; text-decoration: none;">View Full Reports</a>
    </p>
  </div>
</div>`;
}

function kpiCell(label: string, value: string, color?: string): string {
  return `<td style="padding: 12px; text-align: center; background: #F7F8FA; border-radius: 6px;">
    <div style="font-size: 24px; font-weight: 700; color: ${color ?? "#002B4D"};">${value}</div>
    <div style="font-size: 11px; color: #8896A6; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">${label}</div>
  </td>`;
}
