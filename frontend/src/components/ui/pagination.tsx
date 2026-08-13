import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const Pagination = React.forwardRef<HTMLElement, React.ComponentProps<"nav">>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      role="navigation"
      aria-label="Paginação"
      className={cn("flex w-full items-center justify-center", className)}
      {...props}
    />
  ),
);
Pagination.displayName = "Pagination";

const paginationButtonClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-foreground transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45";

type PaginationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

const PaginationButton = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, isActive, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        paginationButtonClass,
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "border border-transparent hover:border-border hover:bg-surface-subtle",
        className,
      )}
      {...props}
    />
  ),
);
PaginationButton.displayName = "PaginationButton";

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Ir para a página anterior"
      className={cn("gap-1 border border-border px-2.5 sm:px-3", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Anterior</span>
      {children}
    </PaginationButton>
  ),
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationButtonProps>(
  ({ className, children, ...props }, ref) => (
    <PaginationButton
      ref={ref}
      aria-label="Ir para a próxima página"
      className={cn("gap-1 border border-border px-2.5 sm:px-3", className)}
      {...props}
    >
      {children}
      <span className="hidden sm:inline">Próxima</span>
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </PaginationButton>
  ),
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-9 w-6 items-center justify-center text-muted-foreground sm:w-9",
        className,
      )}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Mais páginas</span>
    </span>
  ),
);
PaginationEllipsis.displayName = "PaginationEllipsis";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
};

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function visiblePages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: PageItem[] = [1];
  const start = Math.max(2, Math.min(page - 1, totalPages - 3));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 4));

  if (start > 2) pages.push("ellipsis-start");
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (end < totalPages - 1) pages.push("ellipsis-end");
  pages.push(totalPages);
  return pages;
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
  label = "Paginação",
  className,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);
  return (
    <Pagination aria-label={label} className={cn("mt-8", className)}>
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/80 p-1.5 shadow-sm">
        <PaginationPrevious
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
        />

        {visiblePages(safePage, totalPages).map((item) =>
          typeof item === "number" ? (
            <PaginationButton
              key={item}
              isActive={item === safePage}
              aria-label={`Ir para a página ${item}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PaginationButton>
          ) : (
            <PaginationEllipsis key={item} />
          ),
        )}

        <PaginationNext
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        Página {safePage} de {totalPages}
      </span>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationButton,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationControls,
};
