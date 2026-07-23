import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; to?: string };
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-card p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.to ? (
            <Button asChild size="sm"><Link to={action.to}>{action.label}</Link></Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
