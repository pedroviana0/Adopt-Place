import Link from "next/link";
import { Heart, Send } from "lucide-react";

type ProtectedActionButtonsProps = {
  animalId: string;
  available: boolean;
};

function loginHref(animalId: string, action: "solicitar" | "favoritar") {
  const callbackUrl = `/animais/${animalId}`;
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}&action=${action}`;
}

export function ProtectedActionButtons({ animalId, available }: ProtectedActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {available ? (
        <Link
          href={loginHref(animalId, "solicitar")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
        >
          <Send aria-hidden="true" size={16} />
          Solicitar adocao
        </Link>
      ) : null}
      <Link
        href={loginHref(animalId, "favoritar")}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-transparent px-4 text-sm font-medium transition hover:bg-[var(--muted)]"
      >
        <Heart aria-hidden="true" size={16} />
        Favoritar
      </Link>
    </div>
  );
}
