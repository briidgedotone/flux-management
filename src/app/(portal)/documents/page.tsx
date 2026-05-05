"use client";

import { useState } from "react";
import {
  FileTextIcon,
  FilePdfIcon,
  FileXlsIcon,
  FilePptIcon,
  ImageIcon,
  FileIcon,
  MagnifyingGlassIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { useDocuments } from "@/hooks/use-documents";
import { useClientFilter } from "@/hooks/use-client-filter";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

const fileTypeIcons: Record<string, { icon: typeof FileIcon; color: string }> = {
  pdf: { icon: FilePdfIcon, color: "text-error" },
  docx: { icon: FileTextIcon, color: "text-blue" },
  xlsx: { icon: FileXlsIcon, color: "text-success" },
  pptx: { icon: FilePptIcon, color: "text-warning" },
  image: { icon: ImageIcon, color: "text-blue" },
};

const fileTypeLabels: Record<string, string> = {
  pdf: "PDF",
  docx: "Document",
  xlsx: "Spreadsheet",
  pptx: "Presentation",
  image: "Image",
  other: "Other",
};

export default function DocumentsPage() {
  const { clientId, clientName, isFiltered } = useClientFilter();
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");

  const { data: rawData, isLoading } = useDocuments({
    clientId: clientId ?? undefined,
    search: search || undefined,
    fileType: fileTypeFilter || undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as any;
  const documents: any[] = data?.documents ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle={isFiltered ? `Documents for ${clientName}` : `${stats?.total ?? 0} documents across ${stats?.clientsWithDocs ?? 0} clients`}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon size={16} weight="light" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full h-9 pl-9 pr-3 text-sm border border-ice rounded-lg bg-white focus:border-blue focus:ring-2 focus:ring-blue-10 outline-none transition-colors"
          />
        </div>
        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-ice rounded-lg bg-white"
        >
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">Documents</option>
          <option value="xlsx">Spreadsheets</option>
          <option value="pptx">Presentations</option>
          <option value="image">Images</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl shadow-level-1 border border-ice/40 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-sm text-text-muted">Loading documents...</div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ice">
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-6 py-3">Name</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">Client</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">Type</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">Folder</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">Size</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">Modified</th>
                  <th className="text-left text-[11px] uppercase tracking-[0.08em] font-medium text-text-muted px-4 py-3">{" "}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc: any) => {
                  const ft = fileTypeIcons[doc.fileType] ?? { icon: FileIcon, color: "text-text-muted" };
                  const FtIcon = ft.icon;
                  return (
                    <tr key={doc.id} className="border-t border-ice hover:bg-ice-30/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <FtIcon size={18} weight="light" className={ft.color} />
                          <span className="text-[13px] font-medium text-text-primary truncate max-w-[280px]">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">{doc.clientName}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-medium text-text-muted uppercase">{fileTypeLabels[doc.fileType] ?? doc.fileType}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-muted truncate max-w-[180px]">{doc.folderPath || "/"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-muted whitespace-nowrap">{doc.sizeDisplay ?? "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-text-muted whitespace-nowrap">
                        {doc.modifiedAt ? new Date(doc.modifiedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {doc.webUrl && (
                          <a
                            href={doc.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-blue transition-colors"
                            title="Open in SharePoint"
                          >
                            <ArrowSquareOutIcon size={16} weight="light" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-text-muted">
            {search || fileTypeFilter ? "No documents match your filters." : "No documents found. Documents will appear once synced from SharePoint."}
          </div>
        )}
      </div>
    </div>
  );
}
