import type { DialogHTMLAttributes, HTMLAttributes } from "react";

export function Dialog({ className = "", ...props }: DialogHTMLAttributes<HTMLDialogElement>) {
  return (
    <dialog
      className={`rounded-md border bg-[var(--popover)] p-0 text-[var(--popover-foreground)] shadow-lg backdrop:bg-black/30 ${className}`}
      {...props}
    />
  );
}

export function DialogContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props} />;
}

export function DialogHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 space-y-1 ${className}`} {...props} />;
}
