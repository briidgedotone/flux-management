"use client";

import { XIcon, PaperclipIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./status-badge";
import { PriorityIndicator } from "./priority-indicator";
import { AnimatePresence, motion } from "framer-motion";

/** Strip HTML tags and CSS, extract readable text. R19: no dangerouslySetInnerHTML. */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove CSS blocks (inline style declarations at the top of Atera descriptions)
    .replace(/[a-z,\s]+\{[^}]*\}/gi, "")
    // Remove CSS selector lines (e.g., "p, strong, em, ul, ol, li, img, h1, h2, h3...")
    .replace(/^[\s]*[a-z][a-z0-9,\s]*(?:,\s*[a-z][a-z0-9]*)+\s*$/gim, "")
    // Replace block-end tags and <br> with a marker, then normalize
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse runs of spaces/tabs on a single line
    .replace(/[ \t]+/g, " ")
    // Remove lines that are only whitespace
    .replace(/^\s+$/gm, "")
    // Collapse 3+ newlines into double (keeps one blank line between paragraphs)
    .replace(/\n{3,}/g, "\n\n")
    // Trim whitespace
    .trim();
}

interface TicketSlideOverProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ticket: any | null;
  onClose: () => void;
}

const eventColors: Record<string, string> = {
  update: "bg-blue",
  resolution: "bg-success",
  pending: "bg-warning",
  system: "bg-silver-dark",
  comment: "bg-blue",
};

const fileTypeColors: Record<string, string> = {
  pdf: "text-error",
  docx: "text-blue",
  xlsx: "text-success",
  image: "text-[#8B5CF6]",
  pptx: "text-warning",
  other: "text-text-muted",
};

export function TicketSlideOver({ ticket, onClose }: TicketSlideOverProps) {
  if (!ticket) return null;

  const assignedName = ticket.assignedToName ?? ticket.assignedTo?.name ?? "";
  const initials = assignedName
    ? assignedName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "?";
  const activities = ticket.activities ?? ticket.activity ?? [];
  const attachments = ticket.attachments ?? [];
  const internalNotes = ticket.internalNotes ?? [];
  const resolutionDisplay = ticket.resolutionTimeHours
    ? `${ticket.resolutionTimeHours.toFixed(1)}h`
    : ticket.resolutionTime ?? "In progress";
  const createdDate = ticket.createdAt ?? ticket.created ?? "";
  const ticketNumber = ticket.ticketNumber ?? ticket.id;

  return (
    <AnimatePresence>
      {ticket && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-0 right-0 h-screen w-full sm:w-[480px] lg:w-[560px] bg-white shadow-level-4 z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-ice flex-shrink-0">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-ice-30 transition-colors"
              >
                <XIcon size={20} weight="light" className="text-text-secondary" />
              </button>
              <span className="font-mono text-sm font-normal text-navy">
                {ticketNumber}
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityIndicator priority={ticket.priority} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {/* Subject */}
              <h2 className="font-[family-name:var(--font-aptos)] font-semibold text-lg text-navy">
                {ticket.subject}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {assignedName && <>Assigned to {assignedName} &bull; </>}
                {createdDate ? new Date(createdDate).toLocaleDateString() : ""}
              </p>

              <div className="border-t border-ice my-5" />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Status</p>
                  <StatusBadge status={ticket.status} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Priority</p>
                  <PriorityIndicator priority={ticket.priority} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Assigned To</p>
                  {assignedName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-navy-80 flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium">{initials}</span>
                      </div>
                      <span className="text-xs text-text-secondary">{assignedName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">Unassigned</span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Resolution Time</p>
                  <span className="text-xs text-text-primary">{resolutionDisplay}</span>
                </div>
                {ticket.clientName && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Client</p>
                    <span className="text-xs text-text-primary">{ticket.clientName}</span>
                  </div>
                )}
                {ticket.source && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted font-medium mb-1">Source</p>
                    <span className="text-xs text-text-primary">{ticket.source}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {ticket.description && (
                <>
                  <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mt-6 mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-text-primary leading-normal whitespace-pre-line">{stripHtml(ticket.description)}</p>
                </>
              )}

              {/* Activity Timeline */}
              {activities.length > 0 && (
                <>
                  <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mt-6 mb-3">
                    Activity
                  </h3>
                  <div className="relative ml-[18px] border-l-2 border-ice">
                    {activities.map((event: any, i: number) => (
                      <motion.div
                        key={event.id ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.2 }}
                        className="relative pl-5 pb-5 last:pb-0"
                      >
                        <div
                          className={`absolute -left-[5px] top-0.5 w-2 h-2 rounded-full ${eventColors[event.type] ?? "bg-text-muted"}`}
                        />
                        <p className="text-[13px] font-medium text-text-primary">{event.title}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          {event.createdAt ? new Date(event.createdAt).toLocaleString() : event.timestamp ?? ""}
                        </p>
                        {(event.note || event.content) && (
                          <div className="mt-1.5 bg-ice-30 rounded-md px-3.5 py-2.5">
                            <p className="text-[13px] text-text-secondary">{event.note ?? event.content}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Internal Notes (management-only) */}
              {internalNotes.length > 0 && (
                <>
                  <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mt-6 mb-3">
                    Internal Notes
                  </h3>
                  <div className="space-y-3">
                    {internalNotes.map((note: any, i: number) => (
                      <div key={note.id ?? i} className="bg-warning/5 border border-warning/20 rounded-xl px-4 py-3">
                        <p className="text-[13px] text-text-primary">{note.content}</p>
                        <p className="text-[11px] text-text-muted mt-1">
                          {note.authorName ?? "Unknown"} &bull; {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <>
                  <h3 className="font-[family-name:var(--font-aptos)] font-semibold text-[15px] text-text-primary mt-6 mb-3">
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {attachments.map((file: any, i: number) => (
                      <div
                        key={file.id ?? i}
                        className="flex items-center gap-3 border border-ice rounded-md px-3.5 py-2.5 hover:bg-ice-30 transition-colors"
                      >
                        <PaperclipIcon size={16} weight="light" className={fileTypeColors[file.fileType ?? file.type] ?? "text-text-muted"} />
                        <span className="text-[13px] text-text-primary flex-1 truncate">{file.name}</span>
                        <span className="text-[11px] text-text-muted">{file.size}</span>
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ice transition-colors">
                          <DownloadSimpleIcon size={16} weight="light" className="text-text-secondary" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
