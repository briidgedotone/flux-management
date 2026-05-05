"use client";

import {
  CheckCircleIcon,
  WarningCircleIcon,
  XCircleIcon,
  ArrowsClockwiseIcon,
  CloudIcon,
  ShieldCheckIcon,
  TreeStructureIcon,
  PlugIcon,
  EnvelopeIcon,
  KanbanIcon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";
import { useConnectors } from "@/hooks/use-connectors";
import { cn } from "@/lib/utils";

const connectorMeta: Record<string, { name: string; description: string; icon: typeof PlugIcon; syncFrequency: string }> = {
  atera: { name: "Atera", description: "IT helpdesk tickets and device monitoring", icon: TreeStructureIcon, syncFrequency: "Every 5 minutes" },
  planner: { name: "Microsoft Planner", description: "Project tasks and assignments", icon: KanbanIcon, syncFrequency: "Every 15 minutes" },
  sharepoint: { name: "SharePoint", description: "Documents and tech stack data", icon: CloudIcon, syncFrequency: "Every 30 minutes" },
  outlook: { name: "Outlook", description: "Email notifications", icon: EnvelopeIcon, syncFrequency: "On demand" },
};

type AggregatedConnector = {
  id: string;
  name: string;
  description: string;
  icon: typeof PlugIcon;
  syncFrequency: string;
  totalRecords: number;
  lastSynced: string | null;
  clients: { name: string; status: string; records: number; lastSynced: string | null; error: string | null }[];
};

export default function ConnectorsPage() {
  const { data: rawData, isLoading, error } = useConnectors();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiConnectors: any[] = (rawData as any[]) ?? [];

  // Aggregate per-client statuses into one card per connector type
  const connectorMap = new Map<string, AggregatedConnector>();
  for (const c of apiConnectors) {
    const meta = connectorMeta[c.connector];
    if (!meta) continue;

    let agg = connectorMap.get(c.connector);
    if (!agg) {
      agg = {
        id: c.connector,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        syncFrequency: meta.syncFrequency,
        totalRecords: 0,
        lastSynced: null,
        clients: [],
      };
      connectorMap.set(c.connector, agg);
    }

    agg.clients.push({
      name: c.clientName,
      status: c.status,
      records: c.recordsSynced ?? 0,
      lastSynced: c.lastSynced,
      error: c.errorMessage,
    });
    agg.totalRecords += c.recordsSynced ?? 0;
    if (c.lastSynced && (!agg.lastSynced || c.lastSynced > agg.lastSynced)) {
      agg.lastSynced = c.lastSynced;
    }
  }
  const connectors = Array.from(connectorMap.values());

  // Summary stats
  const totalConnected = connectors.filter(c => c.clients.every(cl => cl.status === "connected")).length;
  const totalPartial = connectors.filter(c => c.clients.some(cl => cl.status === "connected") && c.clients.some(cl => cl.status !== "connected")).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connectors"
        subtitle="Monitor external service integrations and data sync health"
      />

      {/* Summary strip */}
      {!isLoading && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon size={16} weight="fill" className="text-success" />
            <span className="text-text-secondary">{totalConnected} fully connected</span>
          </div>
          {totalPartial > 0 && (
            <div className="flex items-center gap-1.5">
              <WarningCircleIcon size={16} weight="fill" className="text-warning" />
              <span className="text-text-secondary">{totalPartial} partially connected</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted text-xs">Total records synced: {connectors.reduce((s, c) => s + c.totalRecords, 0).toLocaleString()}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 text-sm text-text-muted">Loading connectors...</div>
      )}
      {error && (
        <div className="text-center py-12 text-sm text-error">Failed to load connectors.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {connectors.map((connector) => (
          <ConnectorCard key={connector.id} connector={connector} />
        ))}
      </div>
    </div>
  );
}

function ConnectorCard({ connector }: { connector: AggregatedConnector }) {
  const connectedClients = connector.clients.filter(c => c.status === "connected");
  const disconnectedClients = connector.clients.filter(c => c.status !== "connected");
  const allConnected = disconnectedClients.length === 0;
  const noneConnected = connectedClients.length === 0;
  const neverSynced = !connector.lastSynced;

  const Icon = connector.icon;

  // Determine overall status
  let statusLabel: string;
  let statusColor: string;
  let StatusIcon: typeof CheckCircleIcon;
  let borderClass: string;
  let bgClass: string;

  if (allConnected) {
    statusLabel = "Connected";
    statusColor = "text-success";
    StatusIcon = CheckCircleIcon;
    borderClass = "border-success/20";
    bgClass = "bg-success/5";
  } else if (noneConnected && neverSynced) {
    statusLabel = "Not configured";
    statusColor = "text-text-muted";
    StatusIcon = XCircleIcon;
    borderClass = "border-ice";
    bgClass = "";
  } else if (noneConnected) {
    statusLabel = "Disconnected";
    statusColor = "text-error";
    StatusIcon = WarningCircleIcon;
    borderClass = "border-error/20";
    bgClass = "bg-error/5";
  } else {
    statusLabel = `${connectedClients.length}/${connector.clients.length} connected`;
    statusColor = "text-warning";
    StatusIcon = WarningCircleIcon;
    borderClass = "border-warning/20";
    bgClass = "bg-warning/5";
  }

  return (
    <div className={cn("rounded-2xl border p-6 transition-shadow hover:shadow-level-1", borderClass, bgClass)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            allConnected ? "bg-success/10" : noneConnected && neverSynced ? "bg-ice-30" : "bg-ice-30"
          )}>
            <Icon size={20} weight="light" className={allConnected ? "text-success" : "text-navy"} />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary">
              {connector.name}
            </h3>
            <p className="text-[12px] text-text-muted">{connector.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusIcon size={14} weight="fill" className={statusColor} />
          <span className={cn("text-xs font-medium", statusColor)}>{statusLabel}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-ice/60 my-4" />

      {/* Per-client breakdown */}
      <div className="space-y-2">
        {connector.clients.map((client) => (
          <div key={client.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                client.status === "connected" ? "bg-success" :
                client.status === "error" ? "bg-error" : "bg-text-muted"
              )} />
              <span className="text-text-secondary">{client.name}</span>
            </div>
            <div className="flex items-center gap-3 text-text-muted">
              {client.records > 0 && (
                <span>{client.records.toLocaleString()} records</span>
              )}
              {client.status === "error" && client.error && (
                <span className="text-error text-[11px]">Error</span>
              )}
              {client.status === "connected" && !client.lastSynced && (
                <span>Never synced</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-ice/60">
        <div className="flex items-center gap-1.5">
          <ArrowsClockwiseIcon size={12} weight="light" className="text-text-muted" />
          <span className="text-[11px] text-text-muted">
            {connector.lastSynced
              ? `Last sync: ${new Date(connector.lastSynced).toLocaleString()}`
              : "Never synced"
            }
          </span>
        </div>
        <span className="text-[11px] text-text-muted">{connector.syncFrequency}</span>
      </div>
    </div>
  );
}
