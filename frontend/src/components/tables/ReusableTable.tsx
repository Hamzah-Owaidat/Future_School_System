"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ArrowRightIcon, ChevronDownIcon } from "@/icons/index";
import { Tooltip } from "../ui/tooltip/Tooltip";
import ActionsDropdown, { CustomActionItem } from "./ActionsDropdown";
import Input from "../form/input/InputField";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string; // Optional width for column (e.g., "150px", "20%", "auto")
  minWidth?: string; // Optional minimum width
  maxWidth?: string; // Optional maximum width
  filterable?: boolean; // Whether this column can be filtered (default: true)
}

export interface ActionHandlers<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCopyId?: (row: T) => void;
  customActions?: CustomActionItem<T>[];
}

export interface ReusableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: ActionHandlers<T>;
  className?: string;
  enableFilter?: boolean; // Enable filter/search (default: true)
  enablePagination?: boolean; // Enable pagination (default: true)
  rowsPerPage?: number; // Number of rows per page (default: 5)
  filterPlaceholder?: string; // Placeholder for filter input
   enableSortControls?: boolean; // Show sort-by dropdown controls (default: true)
}

export function ReusableTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  className = "",
  enableFilter = true,
  enablePagination = true,
  rowsPerPage = 5,
  filterPlaceholder = "Search...",
  enableSortControls = true,
}: ReusableTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterText, setFilterText] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Derive list of sortable columns for the sort controls
  const sortableColumns = useMemo(
    () => columns.filter((col) => col.sortable !== false),
    [columns]
  );

  // Handle column header click for sorting
  const handleSort = (columnKey: keyof T | string) => {
    if (sortColumn === columnKey) {
      // Toggle between asc, desc, and null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  // Filter the data based on search text
  const filteredData = useMemo(() => {
    if (!enableFilter || !filterText.trim()) {
      return data;
    }

    const searchText = filterText.toLowerCase().trim();
    return data.filter((row) => {
      // Search across all filterable columns
      return columns.some((column) => {
        // Skip if column is explicitly not filterable
        if (column.filterable === false) return false;

        const value = row[column.key];
        if (value == null) return false;

        // Convert to string and search
        const stringValue = String(value).toLowerCase();
        return stringValue.includes(searchText);
      });
    });
  }, [data, filterText, columns, enableFilter]);

  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate the sorted data
  const paginatedData = useMemo(() => {
    if (!enablePagination) {
      return sortedData;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage, enablePagination]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!enablePagination) return 1;
    return Math.ceil(sortedData.length / rowsPerPage);
  }, [sortedData.length, rowsPerPage, enablePagination]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (enablePagination) {
      setCurrentPage(1);
    }
  }, [filterText, enablePagination]);

  // Get sort icon for column header
  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortColumn !== columnKey) {
      return null;
    }
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="w-4 h-4 ml-1 inline-block" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 ml-1 inline-block" />
    );
  };

  // Helper function to render cell content with truncation and tooltip
  const renderCellContent = (column: Column<T>, value: any, row: T) => {
    if (column.render) {
      const rendered = column.render(value, row);
      // If it's a string or can be converted to string, wrap with tooltip
      const textValue = String(value ?? "");
      if (textValue.length > 30 && typeof rendered === "string") {
        return (
          <Tooltip content={textValue}>
            <div className="truncate">{rendered}</div>
          </Tooltip>
        );
      }
      return rendered;
    }

    const textValue = String(value ?? "");
    const cellContent = (
      <div
        className="truncate"
        style={{
          maxWidth: column.maxWidth || "200px",
        }}
      >
        {textValue}
      </div>
    );

    // Show tooltip if text is long (likely to be truncated)
    if (textValue.length > 25) {
      return (
        <Tooltip content={textValue}>
          {cellContent}
        </Tooltip>
      );
    }

    return cellContent;
  };

  // Handle pagination navigation
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar: Filter + Sort controls */}
      {(enableFilter || (enableSortControls && sortableColumns.length > 0) || enablePagination) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left side: Filter input */}
          {enableFilter && (
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder={filterPlaceholder}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Right side: Sort controls + summary */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-4">
            {enableSortControls && sortableColumns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--theme-text-secondary)" }}>
                  Sort by
                </span>
                {/* Column select */}
                <div className="relative">
                  <select
                    value={sortColumn ? String(sortColumn) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSortColumn(null);
                        setSortDirection(null);
                        return;
                      }
                      const matched = sortableColumns.find(
                        (c) => String(c.key) === value
                      );
                      if (matched) {
                        setSortColumn(matched.key);
                        if (!sortDirection) {
                          setSortDirection("asc");
                        }
                      }
                    }}
                    className="h-9 appearance-none rounded-lg border px-3 pr-8 text-xs md:text-sm cursor-pointer transition-colors focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--theme-border)",
                      backgroundColor: "var(--theme-surface)",
                      color: "var(--theme-text-primary)",
                      paddingRight: "2rem",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--theme-brand-500, #465fff)";
                      e.target.style.boxShadow = "0 0 0 2px rgba(70, 95, 255, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--theme-border)";
                      e.target.style.boxShadow = "none";
                    }}
                    onMouseEnter={(e) => {
                      if (document.activeElement !== e.target) {
                        e.currentTarget.style.borderColor = "var(--theme-border-hover, var(--theme-border))";
                        e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.currentTarget.style.borderColor = "var(--theme-border)";
                        e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                      }
                    }}
                  >
                    <option value="" style={{ backgroundColor: "var(--theme-surface)", color: "var(--theme-text-primary)" }}>
                      None
                    </option>
                    {sortableColumns.map((col) => (
                      <option 
                        key={String(col.key)} 
                        value={String(col.key)}
                        style={{ backgroundColor: "var(--theme-surface)", color: "var(--theme-text-primary)" }}
                      >
                        {col.label}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div 
                    className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Direction select */}
                <div className="relative">
                  <select
                    value={sortDirection || ""}
                    onChange={(e) => {
                      const value = e.target.value as SortDirection;
                      if (!value) {
                        setSortDirection(null);
                        setSortColumn(null);
                      } else {
                        setSortDirection(value);
                        if (!sortColumn && sortableColumns[0]) {
                          setSortColumn(sortableColumns[0].key);
                        }
                      }
                    }}
                    className="h-9 appearance-none rounded-lg border px-3 pr-8 text-xs md:text-sm cursor-pointer transition-colors focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "var(--theme-border)",
                      backgroundColor: "var(--theme-surface)",
                      color: "var(--theme-text-primary)",
                      paddingRight: "2rem",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--theme-brand-500, #465fff)";
                      e.target.style.boxShadow = "0 0 0 2px rgba(70, 95, 255, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--theme-border)";
                      e.target.style.boxShadow = "none";
                    }}
                    onMouseEnter={(e) => {
                      if (document.activeElement !== e.target) {
                        e.currentTarget.style.borderColor = "var(--theme-border-hover, var(--theme-border))";
                        e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (document.activeElement !== e.target) {
                        e.currentTarget.style.borderColor = "var(--theme-border)";
                        e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                      }
                    }}
                  >
                    <option value="" style={{ backgroundColor: "var(--theme-surface)", color: "var(--theme-text-primary)" }}>
                      Order
                    </option>
                    <option value="asc" style={{ backgroundColor: "var(--theme-surface)", color: "var(--theme-text-primary)" }}>
                      Ascending
                    </option>
                    <option value="desc" style={{ backgroundColor: "var(--theme-surface)", color: "var(--theme-text-primary)" }}>
                      Descending
                    </option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div 
                    className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5"
                    style={{ color: "var(--theme-text-tertiary)" }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}

            {/* Entries summary */}
            {enablePagination && (
              <div
                className="text-xs md:text-sm text-right"
                style={{ color: "var(--theme-text-secondary)" }}
              >
                Showing{" "}
                {paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
                {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        className="rounded-lg border"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-surface)",
          overflow: "hidden",
        }}
      >
        <div 
          className="overflow-x-auto custom-scrollbar"
          style={{
            maxHeight: "calc(100vh - 300px)",
          }}
        >
        <Table className="w-full">
          <TableHeader
            className="border-b sticky top-0 z-10"
            style={{ 
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-surface)",
            }}
          >
            <TableRow>
              {/* Row number column */}
              <TableCell
                isHeader
                className="px-4 py-2.5 font-medium text-start text-theme-xs whitespace-nowrap"
                style={{
                  color: "var(--theme-text-secondary)",
                  width: "60px",
                  minWidth: "60px",
                }}
              >
                #
              </TableCell>
              {columns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  isHeader
                  className={`px-4 py-2.5 font-medium text-start text-theme-xs transition-colors whitespace-nowrap ${
                    column.sortable !== false
                      ? "cursor-pointer select-none hover:opacity-70"
                      : ""
                  }`}
                  style={{
                    color: "var(--theme-text-secondary)",
                    width: column.width || "auto",
                    minWidth: column.minWidth || "100px",
                    maxWidth: column.maxWidth || "none",
                  }}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }
                >
                  <span className="flex items-center gap-1.5">
                    {column.label}
                    {getSortIcon(column.key) && (
                      <span style={{ color: "var(--theme-text-tertiary)" }}>
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </span>
                </TableCell>
              ))}
              {/* Action column - always last */}
              <TableCell
                isHeader
                className="px-4 py-2.5 font-medium text-start text-theme-xs whitespace-nowrap"
                style={{
                  color: "var(--theme-text-secondary)",
                  width: "80px",
                  minWidth: "80px",
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody
            style={{ borderColor: "var(--theme-border)" }}
          >
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="px-4 py-8 text-center text-theme-sm"
                  style={{ color: "var(--theme-text-secondary)" }}
                >
                  {filterText.trim() ? "No results found" : "No data available"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => {
                // Calculate actual row number for pagination
                const actualRowNumber = enablePagination
                  ? (currentPage - 1) * rowsPerPage + rowIndex + 1
                  : rowIndex + 1;

                return (
                  <TableRow
                    key={rowIndex}
                    className="border-b transition-colors duration-150"
                    style={{
                      borderColor: "var(--theme-border)",
                      backgroundColor: "var(--theme-surface)",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                    }}
                  >
                    {/* Row number cell */}
                    <TableCell
                      className="px-4 py-2.5 text-theme-sm text-center"
                      style={{ 
                        color: "var(--theme-text-tertiary)",
                        width: "60px",
                        minWidth: "60px",
                      }}
                    >
                      {actualRowNumber}
                    </TableCell>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className="px-4 py-2.5 text-theme-sm"
                      style={{ 
                        color: "var(--theme-text-primary)",
                        width: column.width || "auto",
                        minWidth: column.minWidth || "100px",
                        maxWidth: column.maxWidth || "none",
                      }}
                    >
                      {renderCellContent(column, row[column.key], row)}
                    </TableCell>
                  ))}
                  {/* Action dropdown column */}
                  <TableCell 
                    className="px-4 py-2.5 whitespace-nowrap"
                    style={{
                      width: "80px",
                      minWidth: "80px",
                    }}
                  >
                    <ActionsDropdown
                      row={row}
                      onView={actions?.onView}
                      onEdit={actions?.onEdit}
                      onDelete={actions?.onDelete}
                      onCopyId={actions?.onCopyId}
                      customActions={actions?.customActions}
                    />
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      {/* Pagination Controls */}
      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t"
          style={{
            borderColor: "var(--theme-border)",
            backgroundColor: "var(--theme-surface)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-9 h-9 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: currentPage === 1 ? "transparent" : "var(--theme-surface)",
                color: "var(--theme-text-primary)",
              }}
              onMouseEnter={(e) => {
                if (currentPage > 1) {
                  e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage > 1) {
                  e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                }
              }}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      currentPage === pageNum ? "font-semibold" : ""
                    }`}
                    style={{
                      borderColor: currentPage === pageNum ? "var(--theme-brand-500, #465fff)" : "var(--theme-border)",
                      backgroundColor: currentPage === pageNum ? "var(--theme-brand-500, #465fff)" : "var(--theme-surface)",
                      color: currentPage === pageNum ? "#ffffff" : "var(--theme-text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: currentPage === totalPages ? "transparent" : "var(--theme-surface)",
                color: "var(--theme-text-primary)",
              }}
              onMouseEnter={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.backgroundColor = "var(--theme-surface-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.backgroundColor = "var(--theme-surface)";
                }
              }}
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReusableTable;

