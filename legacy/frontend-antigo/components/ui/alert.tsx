import type { HTMLAttributes } from "react";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

const variants: Record<NonNullable<AlertProps["variant"]>, string> = {
  default: "border-[var(--border)] bg-white",
  destructive: "border-[var(--destructive)] bg-red-50 text-[var(--destructive)]",
};

export function Alert({ className = "", variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-md border p-4 text-sm ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
