"use client";

import { type ReactNode, useState, useMemo, useCallback } from "react";
import { SortAscending, SortDescending } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
  getRowId: (item: T) => string;
}

type SortDirection = "asc" | "desc";

interface SortState {
  key: string;
  direction: SortDirection;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  selectedId,
  getRowId,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      setSort((prev) => {
        if (prev?.key === key) {
          return prev.direction === "asc"
            ? { key, direction: "desc" }
            : null;
        }
        return { key, direction: "asc" };
      });
    },
    []
  );

  const sortedData = useMemo(() => {
    if (!sort) return data;

    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = column.render(a);
      const bVal = column.render(b);

      const aStr = typeof aVal === "string" ? aVal : String(aVal ?? "");
      const bStr = typeof bVal === "string" ? bVal : String(bVal ?? "");

      const comparison = aStr.localeCompare(bStr, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sort, columns]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-ice-30 h-11">
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "px-4 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted sticky top-0 bg-ice-30 z-10",
                  column.sortable && "cursor-pointer select-none",
                  sort?.key === column.key && "text-text-primary"
                )}
                onClick={
                  column.sortable
                    ? () => handleSort(column.key)
                    : undefined
                }
              >
                <div className="flex items-center gap-1.5">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span
                      className={cn(
                        "flex items-center",
                        sort?.key === column.key
                          ? "text-blue"
                          : "text-text-muted opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {sort?.key === column.key &&
                      sort.direction === "desc" ? (
                        <SortDescending size={14} weight="light" />
                      ) : (
                        <SortAscending size={14} weight="light" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const rowId = getRowId(item);
            const isSelected = selectedId === rowId;

            return (
              <tr
                key={rowId}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  "h-13 border-b border-ice-30 transition-colors duration-150",
                  onRowClick && "cursor-pointer",
                  isSelected
                    ? "bg-blue-10 border-l-[3px] border-l-blue"
                    : "hover:bg-blue-10"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 text-sm text-text-primary"
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
