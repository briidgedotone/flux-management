// ============================================================
// Frontend types (moved from src/data/types.ts)
// ============================================================

export type TicketStatus = "Open" | "Pending" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type ProjectStatus = "On Track" | "At Risk" | "Delayed";
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Complete";
export type UserRole = "co-ceo" | "director" | "employee";
export type HealthScore = "healthy" | "at-risk" | "critical";
export type ContractStatus = "active" | "expiring" | "expired";

export interface ManagementUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  initials: string;
}

export interface Client {
  id: string;
  companyName: string;
  primaryContact: { name: string; email: string; phone?: string };
  industry: string;
  contractStatus: ContractStatus;
  contractStartDate: string;
  healthScore: HealthScore;
  monthlyRevenue: number;
  lastActivity: string;
  openTickets: number;
  activeProjects: number;
  slaCompliance: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatar?: string;
  status: "active" | "invited";
  utilization: number;
  activeTasks: number;
  ticketsResolved: number;
  tasksCompleted: number;
  avgResolutionTime: string;
  lastActive: string;
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  content: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created: string;
  updated: string;
  assignedTo: { name: string; initials: string };
  description: string;
  resolutionTime?: string;
  activity: ActivityEvent[];
  attachments?: Attachment[];
  clientId: string;
  clientName: string;
  internalNotes?: InternalNote[];
}

export interface ActivityEvent {
  id: string;
  title: string;
  timestamp: string;
  type: "update" | "resolution" | "pending" | "system" | "internal_note";
  note?: string;
}

export interface Attachment {
  name: string;
  type: "pdf" | "docx" | "xlsx" | "image" | "other";
  size: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  dueDate: string;
  startDate: string;
  description: string;
  category: string;
  assignees: { name: string; initials: string; role: string }[];
  tasks: ProjectTask[];
  clientId: string;
  clientName: string;
  techStack?: ProjectSubscription[];
}

export interface ProjectTask {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TicketPriority;
  assignee: { name: string; initials: string };
  dueDate: string;
}

export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "xlsx" | "image" | "other";
  category: string;
  folder: string;
  modified: string;
  size: string;
}

export interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
}

export interface SoftwareItem {
  id: string;
  name: string;
  icon: string;
  licenseCount: string;
  costPerMonth: string;
  renewalDate: string;
  status: "Active" | "Expiring Soon" | "Expired";
  billingCycle: string;
  adminContact: string;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  type: "monitor" | "server" | "printer" | "wifi";
  location: string;
  status: "Online" | "Offline";
  lastSeen: string;
}

export interface CloudService {
  id: string;
  name: string;
  provider: string;
  tier: string;
  usage: number;
  status: "Active" | "Expiring Soon" | "Expired";
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "ticket" | "project" | "system" | "task_assignment" | "ticket_escalation" | "contact_form" | "health_alert" | "team_update";
  read: boolean;
  link?: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  richContent?: {
    type: "table" | "chart" | "reference";
    data: Record<string, unknown>;
  };
}

export type ConnectorStatus = "Connected" | "Disconnected";

export interface Connector {
  id: string;
  name: string;
  description: string;
  icon: "atera" | "planner" | "sharepoint" | "azure-ad" | "intune" | "teams";
  status: ConnectorStatus;
  lastSynced: string;
  stats: string;
  reconnectMessage?: string;
}

export interface ProjectSubscription {
  id: string;
  name: string;
  licenses: string;
  costPerMonth: string;
  renewalDate: string;
  status: "Active" | "Expiring Soon" | "Expired";
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  action: string;
  description: string;
  entityType: "ticket" | "project" | "document" | "client" | "note" | "task" | "team_member" | "contact_submission";
  entityId: string;
  clientId: string;
  clientName: string;
  timestamp: string;
}

export interface IntegrationConfig {
  id: string;
  service: "atera" | "microsoft365" | "sharepoint";
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  lastSynced?: string;
  apiKey?: string;
}

// ============================================================
// Backend types (new)
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface RequestContext {
  user: AuthUser;
  role: UserRole;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientProfile {
  id: string;
  organizationId: string;
  industry: string | null;
  monthlyRevenue: number | null;
  contractStatus: ContractStatus | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  healthScore: HealthScore | null;
  slaTarget: number;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  notes: string | null;
}

export interface TeamMemberProfile {
  id: string;
  userId: string;
  capacityHoursWeek: number;
  utilizationTarget: number;
  status: "active" | "invited" | "inactive";
  department: string | null;
  hireDate: string | null;
}

export interface ContactFormSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  serviceInterest: string | null;
  message: string | null;
  status: "new" | "reviewed" | "responded";
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSnapshot {
  id: string;
  reportType: "revenue" | "team_performance" | "sla" | "ticket_analytics";
  period: "daily" | "weekly" | "monthly";
  periodDate: string;
  data: Record<string, unknown>;
}

export type ConnectorName = "atera" | "planner" | "sharepoint" | "outlook";
export type ConnectorStatusValue = "connected" | "disconnected" | "error" | "syncing";

export interface SyncResult {
  connector: ConnectorName;
  organizationId: string;
  status: "success" | "failed" | "partial";
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  error?: string;
}
