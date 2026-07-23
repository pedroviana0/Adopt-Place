import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-serif text-xl font-semibold text-foreground ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
        <PawPrint className="h-4 w-4" />
      </span>
      AdoptPlace
    </Link>
  );
}
