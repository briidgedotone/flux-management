import { describe, it, expect } from "vitest";
import { buildWeeklyDigestEmail } from "@/lib/integrations/mail/weekly-digest";

describe("Weekly Digest Email", () => {
  const ticketStats = {
    total: 45,
    open: 8,
    pending: 3,
    closed: 34,
    critical: 2,
    high: 5,
    createdInRange: 12,
    resolvedInRange: 10,
    avgResolutionHours: 4.5,
  };

  const projectStats = {
    total: 6,
    onTrack: 4,
    atRisk: 1,
    delayed: 1,
  };

  it("renders HTML with ticket stats", () => {
    const html = buildWeeklyDigestEmail(ticketStats, projectStats);
    expect(html).toContain("IT Help Desk");
    expect(html).toContain(">12<");  // created
    expect(html).toContain(">10<");  // resolved
    expect(html).toContain(">8<");   // open
    expect(html).toContain(">2<");   // critical
    expect(html).toContain("83%");   // resolution rate (10/12)
    expect(html).toContain("4.5h");  // avg resolution
  });

  it("renders HTML with project stats", () => {
    const html = buildWeeklyDigestEmail(ticketStats, projectStats);
    expect(html).toContain("Projects");
    expect(html).toContain(">6<");   // total
    expect(html).toContain(">4<");   // on track
    expect(html).toContain("need attention");
  });

  it("shows critical ticket warning when critical > 0", () => {
    const html = buildWeeklyDigestEmail(ticketStats, projectStats);
    expect(html).toContain("critical ticket");
    expect(html).toContain("#C53030"); // red color
  });

  it("hides critical warning when no critical tickets", () => {
    const html = buildWeeklyDigestEmail({ ...ticketStats, critical: 0 }, projectStats);
    expect(html).not.toContain("critical ticket");
  });

  it("shows all-on-track message when no at-risk or delayed projects", () => {
    const html = buildWeeklyDigestEmail(ticketStats, { total: 3, onTrack: 3, atRisk: 0, delayed: 0 });
    expect(html).toContain("All projects on track");
  });

  it("includes dashboard and reports links", () => {
    const html = buildWeeklyDigestEmail(ticketStats, projectStats);
    expect(html).toContain("/dashboard");
    expect(html).toContain("/reports");
  });
});
