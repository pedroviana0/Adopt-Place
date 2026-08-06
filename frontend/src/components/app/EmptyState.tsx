import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  to?: string;
};

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "grid place-items-center rounded-xl border border-dashed border-border bg-surface text-center",
        compact ? "p-6" : "px-5 py-10 sm:p-10",
        className,
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.to ? (
            <Button asChild size="sm">
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
