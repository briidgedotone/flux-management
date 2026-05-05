"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FolderSimple,
  FilePdf,
  FileDoc,
  FileXls,
  File,
  Image,
  CaretRight,
  ArrowSquareOut,
  MagnifyingGlass,
  House,
  XCircle,
  GridFour,
  ListBullets,
  FolderOpen,
} from "@phosphor-icons/react";
import { useDocuments } from "@/hooks/use-documents";
import { useClientFilter } from "@/hooks/use-client-filter";
import { PageHeader } from "@/components/shared/page-header";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

const FILE_TYPES: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  pdf:   { Icon: FilePdf, color: "text-error", bg: "bg-error/10" },
  docx:  { Icon: FileDoc, color: "text-blue", bg: "bg-blue/10" },
  xlsx:  { Icon: FileXls, color: "text-success", bg: "bg-success/10" },
  pptx:  { Icon: File, color: "text-blue", bg: "bg-blue/10" },
  image: { Icon: Image, color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
  other: { Icon: File, color: "text-text-secondary", bg: "bg-ice-50" },
};

function getFileType(fileType: string | null) {
  return FILE_TYPES[fileType ?? "other"] ?? FILE_TYPES.other;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface FolderPathEntry {
  folderPath: string;
  clientId: string;
  clientName: string;
}

/**
 * Build folder tree from flat paths.
 * When isAllClients=true, creates client-name folders at the root with their folder structures nested underneath.
 * When a single client is selected, shows the raw folder hierarchy.
 */
function buildFolderTree(entries: FolderPathEntry[], isAllClients: boolean): FolderNode[] {
  const root: FolderNode[] = [];

  if (isAllClients) {
    // Group by client, then nest folder paths under client name
    const byClient = new Map<string, { name: string; paths: string[] }>();
    for (const entry of entries) {
      if (!byClient.has(entry.clientId)) {
        byClient.set(entry.clientId, { name: entry.clientName, paths: [] });
      }
      byClient.get(entry.clientId)!.paths.push(entry.folderPath);
    }

    for (const [clientId, { name, paths }] of byClient) {
      const clientNode: FolderNode = { name, path: `/@${clientId}`, children: [] };
      for (const path of paths) {
        const parts = path.split("/").filter(Boolean);
        let current = clientNode.children;
        let acc = `/@${clientId}`;
        for (const part of parts) {
          acc += "/" + part;
          let node = current.find((n) => n.name === part);
          if (!node) {
            node = { name: part, path: acc, children: [] };
            current.push(node);
          }
          current = node.children;
        }
      }
      root.push(clientNode);
    }
  } else {
    for (const entry of entries) {
      const parts = entry.folderPath.split("/").filter(Boolean);
      let current = root;
      let acc = "";
      for (const part of parts) {
        acc += "/" + part;
        let node = current.find((n) => n.name === part);
        if (!node) {
          node = { name: part, path: acc, children: [] };
          current.push(node);
        }
        current = node.children;
      }
    }
  }

  return root;
}

function findNode(nodes: FolderNode[], path: string): FolderNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findNode(n.children, path);
    if (found) return found;
  }
  return null;
}

function getChildFolders(roots: FolderNode[], currentPath: string): FolderNode[] {
  if (currentPath === "/") return roots;
  return findNode(roots, currentPath)?.children ?? [];
}

function getBreadcrumbs(path: string): { label: string; path: string }[] {
  if (path === "/") return [{ label: "All Documents", path: "/" }];
  const parts = path.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: "All Documents", path: "/" }];
  let acc = "";
  for (const part of parts) {
    acc += "/" + part;
    crumbs.push({ label: part, path: acc });
  }
  return crumbs;
}

function FolderRow({ node, onNavigate }: { node: FolderNode; onNavigate: (path: string) => void }) {
  return (
    <tr className="h-[52px] border-b border-ice/60 last:border-0 hover:bg-blue-10/40 transition-colors cursor-pointer group" onClick={() => onNavigate(node.path)}>
      <td className="pl-4 pr-3 w-11">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-10">
          <FolderSimple size={17} weight="fill" className="text-blue" />
        </div>
      </td>
      <td className="pr-4 text-[13px] font-medium text-text-primary" colSpan={4}>
        {node.name}
      </td>
      <td className="px-4 w-10">
        <CaretRight size={14} weight="bold" className="text-text-muted/40 group-hover:text-blue/60 transition-colors" />
      </td>
    </tr>
  );
}

function FileRow({ doc }: { doc: Doc }) {
  const ft = getFileType(doc.fileType);
  return (
    <tr className="h-[52px] border-b border-ice/60 last:border-0 hover:bg-blue-10/40 transition-colors group">
      <td className="pl-4 pr-3 w-11">
        <div className={`w-8 h-8 rounded flex items-center justify-center ${ft.bg}`}>
          <ft.Icon size={16} weight="light" className={ft.color} />
        </div>
      </td>
      <td className="pr-4 text-[13px] text-text-primary max-w-0 w-full">
        <span className="block truncate">{doc.name}</span>
      </td>
      <td className="px-4 text-xs text-text-secondary hidden sm:table-cell whitespace-nowrap w-[120px]">{doc.clientName}</td>
      <td className="px-4 text-xs text-text-secondary hidden sm:table-cell whitespace-nowrap w-[130px]">{formatDate(doc.modifiedAt)}</td>
      <td className="px-4 text-xs text-text-muted hidden sm:table-cell whitespace-nowrap w-[80px]">{doc.sizeDisplay ?? "—"}</td>
      <td className="px-4 w-10">
        {doc.webUrl && (
          <a href={doc.webUrl} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-blue" title="Open in SharePoint">
            <ArrowSquareOut size={16} weight="light" />
          </a>
        )}
      </td>
    </tr>
  );
}

function FolderChip({ node, onNavigate }: { node: FolderNode; onNavigate: (path: string) => void }) {
  return (
    <button onClick={() => onNavigate(node.path)} className="flex items-center gap-2.5 bg-white border border-ice/60 rounded-lg px-3 py-2.5 hover:bg-blue-10 hover:border-blue/20 transition-all group text-left">
      <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-10">
        <FolderSimple size={17} weight="fill" className="text-blue" />
      </div>
      <span className="text-[13px] font-medium text-text-primary truncate flex-1 min-w-0">{node.name}</span>
      <CaretRight size={13} weight="bold" className="text-text-muted/40 group-hover:text-blue/60 transition-colors flex-shrink-0" />
    </button>
  );
}

function FileCard({ doc }: { doc: Doc }) {
  const ft = getFileType(doc.fileType);
  return (
    <div className="group bg-white rounded-xl border border-ice/60 overflow-hidden hover:-translate-y-0.5 transition-all duration-200">
      <div className={`h-[72px] flex items-center justify-center relative ${ft.bg}`}>
        <ft.Icon size={32} weight="light" className={`${ft.color} opacity-80`} />
        {doc.webUrl && (
          <a href={doc.webUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-navy/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowSquareOut size={20} weight="light" className="text-white" />
          </a>
        )}
      </div>
      <div className="p-3">
        <p className="text-[12.5px] font-medium text-text-primary line-clamp-2 leading-tight">{doc.name}</p>
        <p className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1.5">
          <span>{doc.clientName}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-text-muted/40 inline-block" />
          <span>{doc.sizeDisplay ?? "—"}</span>
        </p>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { clientId, clientName, isFiltered } = useClientFilter();
  const [currentPath, setCurrentPath] = useState("/");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");

  // Reset to root when client filter changes
  useEffect(() => { setCurrentPath("/"); setSearch(""); }, [clientId]);

  const { data: rawData, isLoading } = useDocuments({ clientId: clientId ?? undefined });
  const data = rawData as any;
  const documents: Doc[] = data?.documents ?? [];
  const folderPathEntries: FolderPathEntry[] = data?.folderPaths ?? [];
  const stats = data?.stats;
  const isAllClients = !isFiltered;

  const folderTree = useMemo(() => buildFolderTree(folderPathEntries, isAllClients), [folderPathEntries, isAllClients]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(currentPath), [currentPath]);
  const childFolders = useMemo(() => getChildFolders(folderTree, currentPath), [folderTree, currentPath]);

  // When navigating inside /@clientId/path, extract the real folder path and client filter
  const displayedFiles = useMemo(() => {
    if (search) {
      const q = search.toLowerCase();
      return documents.filter((d) => d.name.toLowerCase().includes(q));
    }

    if (isAllClients && currentPath.startsWith("/@")) {
      // Extract client ID and real folder path from virtual path
      // e.g., "/@uuid/General/subfolder" → clientId=uuid, folderPath="/General/subfolder"
      const withoutPrefix = currentPath.slice(2); // remove "/@"
      const slashIdx = withoutPrefix.indexOf("/");
      if (slashIdx === -1) {
        // At client root — show all docs for this client at root "/"
        const cId = withoutPrefix;
        return documents.filter((d) => d.clientId === cId && d.folderPath === "/");
      } else {
        const cId = withoutPrefix.slice(0, slashIdx);
        const realPath = withoutPrefix.slice(slashIdx);
        return documents.filter((d) => d.clientId === cId && d.folderPath === realPath);
      }
    }

    return documents.filter((d) => d.folderPath === currentPath);
  }, [documents, currentPath, search, isAllClients]);

  const navigate = (path: string) => { setCurrentPath(path); setSearch(""); };
  const hasFolders = !search && childFolders.length > 0;
  const hasFiles = displayedFiles.length > 0;
  const isEmpty = !hasFolders && !hasFiles;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 bg-ice-30 rounded-lg animate-pulse" />
        <div className="h-9 w-72 bg-ice-30 rounded-xl animate-pulse" />
        <div className="bg-white rounded-xl border border-ice/60 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[52px] px-4 flex items-center gap-3 border-b border-ice/60 last:border-0">
              <div className="w-8 h-8 bg-ice-30 rounded-lg animate-pulse" />
              <div className="flex-1 h-3.5 bg-ice-30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle={isFiltered ? `Documents for ${clientName}` : `${stats?.total ?? 0} documents across ${stats?.clientsWithDocs ?? 0} clients`}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass size={15} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all files..."
            className="h-9 w-full bg-white border border-ice rounded-xl pl-9 pr-8 text-[13px] text-text-primary placeholder:text-text-muted focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
              <XCircle size={14} weight="fill" />
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-ice bg-white overflow-hidden">
          {(["list", "grid"] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === mode ? "bg-blue-10 text-blue" : "text-text-muted hover:bg-ice-30"}`}>
              {mode === "list" ? <ListBullets size={16} weight="light" /> : <GridFour size={16} weight="light" />}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumb */}
      {!search && (
        <div className="flex items-center gap-0.5 bg-white border border-ice/60 rounded-xl px-3 h-9 w-fit max-w-full overflow-hidden">
          <button onClick={() => navigate("/")}
            className={`flex items-center gap-1.5 text-[12.5px] transition-colors rounded-md px-1.5 py-1 ${breadcrumbs.length === 1 ? "text-text-primary font-medium" : "text-text-muted hover:text-blue hover:bg-blue-10"}`}>
            <House size={13} weight={breadcrumbs.length === 1 ? "fill" : "light"} className="flex-shrink-0" />
            <span>All Documents</span>
          </button>
          {breadcrumbs.slice(1).map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 2;
            return (
              <div key={crumb.path} className="flex items-center gap-0.5 min-w-0">
                <CaretRight size={11} weight="light" className="text-text-muted/60 flex-shrink-0" />
                <button onClick={() => navigate(crumb.path)}
                  className={`text-[12.5px] transition-colors rounded-md px-1.5 py-1 max-w-[180px] truncate ${isLast ? "text-text-primary font-medium" : "text-text-muted hover:text-blue hover:bg-blue-10"}`}>
                  {crumb.label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {search && (
        <p className="text-[13px] text-text-secondary -mt-1">
          <span className="font-medium text-text-primary">{displayedFiles.length}</span>
          {" "}result{displayedFiles.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen size={52} weight="light" className="text-text-muted mb-3" />
          <p className="text-sm font-medium text-text-primary">{search ? "No files found" : "This folder is empty"}</p>
          <p className="text-xs text-text-muted mt-1">{search ? "Try a different search term." : "No documents in this folder yet."}</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border border-ice/60 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="h-10 border-b border-ice/60">
                <th className="pl-4 pr-3 w-11" />
                <th className="pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted">Name</th>
                <th className="px-4 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted hidden sm:table-cell w-[120px]">Client</th>
                <th className="px-4 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted hidden sm:table-cell w-[130px]">Modified</th>
                <th className="px-4 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted hidden sm:table-cell w-[80px]">Size</th>
                <th className="px-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {hasFolders && childFolders.map((folder) => (
                <FolderRow key={folder.path} node={folder} onNavigate={navigate} />
              ))}
              {hasFolders && hasFiles && (
                <tr><td colSpan={6} className="p-0"><div className="border-t-2 border-ice/60" /></td></tr>
              )}
              {hasFiles && displayedFiles.map((doc) => (
                <FileRow key={doc.id} doc={doc} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {hasFolders && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted mb-2.5">Folders ({childFolders.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {childFolders.map((folder) => (
                  <FolderChip key={folder.path} node={folder} onNavigate={navigate} />
                ))}
              </div>
            </div>
          )}
          {hasFiles && (
            <div>
              {hasFolders && <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted mb-2.5">Files ({displayedFiles.length})</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedFiles.map((doc) => (
                  <FileCard key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
