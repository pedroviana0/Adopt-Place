import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="AdoptPlace — ir para o início"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <img
        src="/logo.png"
        alt="AdoptPlace"
        className="h-9 w-auto dark:rounded-md dark:bg-white dark:p-1 dark:shadow-sm"
      />
      <span className="hidden font-serif text-lg font-semibold text-foreground sm:inline">
        AdoptPlace
      </span>
    </Link>
  );
}
