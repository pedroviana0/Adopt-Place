import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSessao } from "@/lib/data/hooks";
import { fetchUnreadCount } from "@/lib/data/mensagens";
import {
  PawPrint,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  HeartPulse,
  FileText,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Painel — AdoptPlace" }, { name: "description", content: "Painel de gestão." }],
  }),
  component: DashLayout,
});

function DashLayout() {
  const s = useSessao();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isResponsible = s?.tipoPerfil === "ORGANIZACAO" || s?.tipoPerfil === "ACOLHEDOR";
  const unreadQuery = useQuery({
    queryKey: ["mensagens-unread"],
    queryFn: fetchUnreadCount,
    enabled: isResponsible,
    refetchInterval: 30_000,
  });
  const unread = unreadQuery.data ?? 0;

  if (
    !s ||
    (s.tipoPerfil !== "ORGANIZACAO" && s.tipoPerfil !== "ACOLHEDOR" && s.tipoPerfil !== "ADMIN")
  ) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-muted-foreground">
        Área exclusiva para responsáveis operacionais.
      </div>
    );
  }

  const items =
    s.tipoPerfil === "ADMIN"
      ? [{ to: "/dashboard/admin/usuarios", label: "Usuários", icon: ShieldCheck }]
      : [
          { to: "/dashboard", label: "Painel", icon: LayoutDashboard, exact: true },
          { to: "/dashboard/animais", label: "Meus animais", icon: PawPrint },
          { to: "/dashboard/saude", label: "Saúde", icon: HeartPulse },
          { to: "/dashboard/documentos", label: "Documentos", icon: FileText },
          { to: "/dashboard/mensagens", label: "Mensagens", icon: MessageCircle },
          { to: "/dashboard/solicitacoes", label: "Solicitações", icon: ClipboardList },
          { to: "/dashboard/perfil", label: "Meu perfil", icon: UserCog },
        ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {items.map((it) => {
            const active = it.exact ? path === it.to : path.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {it.label}
                {it.to === "/dashboard/mensagens" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
