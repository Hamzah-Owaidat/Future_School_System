import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
  style?: React.CSSProperties; // Optional inline styles
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
  style?: React.CSSProperties; // Optional inline styles
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  style?: React.CSSProperties; // Optional inline styles
  onMouseEnter?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  style?: React.CSSProperties; // Optional inline styles
  colSpan?: number; // Optional colspan attribute
  onClick?: () => void; // Optional click handler
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  return <table className={`min-w-full  ${className}`}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className, style }) => {
  return <thead className={className} style={style}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className, style }) => {
  return <tbody className={className} style={style}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, style, onMouseEnter, onMouseLeave }) => {
  return <tr className={className} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</tr>;
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className,
  style,
  colSpan,
  onClick,
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={` ${className}`} style={style} colSpan={colSpan} onClick={onClick}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
