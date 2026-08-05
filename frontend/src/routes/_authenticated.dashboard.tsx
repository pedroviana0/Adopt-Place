import { useRef, useState } from "react";
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
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Painel — AdoptPlace" }, { name: "description", content: "Painel de gestão." }],
  }),
  component: DashLayout,
});

function DashLayout() {
  const s = useSessao();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const firstMobileDestination = useRef<HTMLAnchorElement>(null);
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

  const navigationLinks = (mobile: boolean) => (
    <nav
      aria-label={mobile ? "Navegação do painel mobile" : "Navegação do painel"}
      className={mobile ? "flex flex-col gap-1" : "flex flex-col gap-2"}
    >
      {items.map((item, index) => {
        const active = item.exact ? path === item.to : path.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            ref={mobile && index === 0 ? firstMobileDestination : undefined}
            to={item.to}
            aria-current={active ? "page" : undefined}
            onClick={mobile ? () => setMobileNavigationOpen(false) : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md border-l-4 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary bg-selection font-semibold text-selection-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
            {item.to === "/dashboard/mensagens" && unread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                <span className="sr-only">Mensagens não lidas: </span>
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:py-8">
      <div className="lg:hidden">
        <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between sm:w-auto"
              aria-label="Abrir navegação do painel"
              aria-expanded={mobileNavigationOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Menu className="h-4 w-4" aria-hidden="true" />
                Menu do painel
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {items.find((item) => (item.exact ? path === item.to : path.startsWith(item.to)))
                  ?.label ?? "Navegação"}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(88vw,22rem)] overflow-y-auto"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              firstMobileDestination.current?.focus();
            }}
          >
            <SheetHeader className="pr-10 text-left">
              <SheetTitle>Menu do painel</SheetTitle>
              <SheetDescription>Destinos disponíveis para seu perfil.</SheetDescription>
            </SheetHeader>
            <div className="mt-6">{navigationLinks(true)}</div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        {navigationLinks(false)}
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
