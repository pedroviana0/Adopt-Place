import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  outline: "border bg-transparent",
};

export function Badge({ className = "", variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
