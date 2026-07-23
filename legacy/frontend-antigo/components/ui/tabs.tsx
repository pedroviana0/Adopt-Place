import type { HTMLAttributes } from "react";

export function Tabs({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function TabsList({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`inline-flex h-10 items-center rounded-md bg-[var(--muted)] p-1 ${className}`}
      {...props}
    />
  );
}

export function TabsTrigger({ className = "", ...props }: HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 items-center justify-center rounded px-3 text-sm font-medium hover:bg-white ${className}`}
      {...props}
    />
  );
}

export function TabsContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-4 ${className}`} {...props} />;
}
