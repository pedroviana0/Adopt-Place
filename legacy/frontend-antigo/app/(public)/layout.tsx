import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-[var(--primary)]">
            AdoptPlace
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <Link href="/">Animais</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
