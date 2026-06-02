import type { ReactNode } from "react";
import Link from "next/link";

import { requireSession } from "@/lib/actions/auth-guards";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireSession();

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-[var(--primary)]">
            AdoptPlace
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/">Vitrine</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
