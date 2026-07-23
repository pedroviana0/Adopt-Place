import type { ReactNode } from "react";
import Link from "next/link";

import { requireSession } from "@/lib/actions/auth-guards";

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await requireSession();
  const canMessage = ["ADOTANTE", "ORGANIZACAO", "ACOLHEDOR"].includes(
    session.user.tipoPerfil,
  );
  const unreadMessages = canMessage
    ? await import("@/lib/queries/mensagens").then(({ getUnreadMessageCount }) =>
        getUnreadMessageCount(),
      )
    : 0;
  const isResponsible = ["ORGANIZACAO", "ACOLHEDOR"].includes(
    session.user.tipoPerfil,
  );

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-[var(--primary)]">
            AdoptPlace
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm text-[var(--muted-foreground)]">
            <Link href="/dashboard">Dashboard</Link>
            {isResponsible ? <Link href="/dashboard/saude">Saude</Link> : null}
            {canMessage ? <Link className="flex items-center gap-1" href="/dashboard/mensagens">Mensagens{unreadMessages > 0 ? <span className="inline-flex min-w-5 items-center justify-center rounded bg-[var(--primary)] px-1 text-xs text-[var(--primary-foreground)]">{unreadMessages}</span> : null}</Link> : null}
            <Link href="/">Vitrine</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
