// Central permissions config — single source of truth for role-based access.
// All access decisions derive from this file. Never hardcode role strings elsewhere.

export type Role = "co-ceo" | "director" | "employee";

export interface Permissions {
  // Navigation
  canAccessLeads: boolean;
  canAccessConnectors: boolean;

  // Clients
  canEditClients: boolean;
  canSeeClientFinancials: boolean;

  // Tickets
  canSeeTicketStats: boolean;

  // Projects
  canCreateProjects: boolean;
  canCreateTasks: boolean;
  canEditAnyTask: boolean;

  // Team
  canEditTeamMembers: boolean;
  canToggleTeamStatus: boolean;
  canSeeInactiveMembers: boolean;

  // Tech Stack
  canSeeTechStackCosts: boolean;
  canEditTechStack: boolean;

  // Documents
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;

  // Reports
  canSeeFinancialReports: boolean;

  // Dashboard
  seePersonalDashboardOnly: boolean;
}

const FULL_ACCESS: Permissions = {
  canAccessLeads: true,
  canAccessConnectors: true,
  canEditClients: true,
  canSeeClientFinancials: true,
  canSeeTicketStats: true,
  canCreateProjects: true,
  canCreateTasks: true,
  canEditAnyTask: true,
  canEditTeamMembers: true,
  canToggleTeamStatus: true,
  canSeeInactiveMembers: true,
  canSeeTechStackCosts: true,
  canEditTechStack: true,
  canUploadDocuments: true,
  canDeleteDocuments: true,
  canSeeFinancialReports: true,
  seePersonalDashboardOnly: false,
};

export const PERMISSIONS: Record<Role, Permissions> = {
  "co-ceo": FULL_ACCESS,
  director: FULL_ACCESS,
  employee: {
    canAccessLeads: false,
    canAccessConnectors: false,
    canEditClients: false,
    canSeeClientFinancials: false,
    canSeeTicketStats: false,
    canCreateProjects: false,
    canCreateTasks: false,
    canEditAnyTask: false,
    canEditTeamMembers: false,
    canToggleTeamStatus: false,
    canSeeInactiveMembers: false,
    canSeeTechStackCosts: false,
    canEditTechStack: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canSeeFinancialReports: false,
    seePersonalDashboardOnly: true,
  },
};

export function getPermissions(role: string): Permissions {
  return PERMISSIONS[role as Role] ?? PERMISSIONS.employee;
}
