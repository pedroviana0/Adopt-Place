import type { TableHTMLAttributes, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full caption-bottom text-sm ${className}`} {...props} />;
}

export function TableHeader({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b ${className}`} {...props} />;
}

export function TableBody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b transition hover:bg-[var(--muted)] ${className}`} {...props} />;
}

export function TableHead({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`h-11 px-3 text-left align-middle font-medium ${className}`} {...props} />;
}

export function TableCell({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`p-3 align-middle ${className}`} {...props} />;
}
