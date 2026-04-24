"use client";

import { useState, useEffect } from "react";
import {
  PlugIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  ArrowsClockwiseIcon,
  CloudIcon,
  ShieldCheckIcon,
  UsersIcon,
  DeviceMobileIcon,
  ChatCircleIcon,
  TreeStructureIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/shared/page-header";
import { useConnectors } from "@/hooks/use-connectors";
import type { Connector } from "@/data/types";
import { cn } from "@/lib/utils";

const connectorIcons: Record<Connector["icon"], typeof PlugIcon> = {
  atera: TreeStructureIcon,
  planner: PlugIcon,
  sharepoint: CloudIcon,
  "azure-ad": ShieldCheckIcon,
  intune: DeviceMobileIcon,
  teams: ChatCircleIcon,
};

export default function ConnectorsPage() {
  const { data: rawData, isLoading, error } = useConnectors();
  const apiConnectors = (rawData as any)?.data as Connector[] ?? [];
  const [connectors, setConnectors] = useState<Connector[]>([]);

  // Sync API data into local state when it arrives
  useEffect(() => {
    if (apiConnectors.length > 0) setConnectors(apiConnectors);
  }, [apiConnectors.length]);

  const handleReconnect = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "Connected" as const, lastSynced: "Synced just now", reconnectMessage: undefined, stats: "Reconnecting..." }
          : c
      )
    );
  };

  return (
    <div>
      <PageHeader
        title="Connectors"
        subtitle="Manage your external service integrations"
        actions={
          <button className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-full hover:bg-navy-95 transition-colors">
            <PlugIcon size={16} weight="light" />
            Add Connector
          </button>
        }
      />

      {isLoading && (
        <div className="text-center py-12 text-sm text-text-muted">Loading connectors...</div>
      )}
      {error && (
        <div className="text-center py-12 text-sm text-error">Failed to load connectors.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {connectors.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onReconnect={handleReconnect}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectorCard({
  connector,
  onReconnect,
}: {
  connector: Connector;
  onReconnect: (id: string) => void;
}) {
  const isConnected = connector.status === "Connected";
  const Icon = connectorIcons[connector.icon];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border p-6 transition-shadow hover:shadow-level-1",
        isConnected ? "border-ice/40" : "border-error/30"
      )}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-ice-30 flex items-center justify-center">
          <Icon size={20} weight="light" className="text-navy" />
        </div>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <CheckCircleIcon size={14} weight="fill" className="text-success" />
              <span className="text-xs font-medium text-success">Connected</span>
            </>
          ) : (
            <>
              <WarningCircleIcon size={14} weight="fill" className="text-error" />
              <span className="text-xs font-medium text-error">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Name + description */}
      <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-base text-text-primary">
        {connector.name}
      </h3>
      <p className="text-[13px] text-text-secondary mt-0.5">
        {connector.description}
      </p>

      {/* Divider */}
      <div className="border-t border-ice my-4" />

      {/* Stats or reconnect message */}
      <p className="text-[13px] text-text-secondary min-h-[20px]">
        {isConnected ? connector.stats : connector.reconnectMessage}
      </p>

      {/* Sync info */}
      <div className="flex items-center gap-1.5 mt-2">
        <ArrowsClockwiseIcon size={12} weight="light" className="text-text-muted" />
        <span className="text-[11px] text-text-muted">{connector.lastSynced}</span>
      </div>

      {/* Reconnect button for disconnected */}
      {!isConnected && (
        <button
          onClick={() => onReconnect(connector.id)}
          className="w-full mt-4 py-2 text-sm font-medium text-blue bg-blue-10 rounded-full hover:bg-blue/10 transition-colors"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
