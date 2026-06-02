import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
  secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
  outline: "border bg-transparent hover:bg-[var(--muted)]",
  ghost: "bg-transparent hover:bg-[var(--muted)]",
  destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90",
};

export function Button({
  className = "",
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
